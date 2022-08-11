import puppeteer, { Page } from 'puppeteer';
import {getLastAuthCookie, restoreCookies, saveCookies} from './cookies';

export interface PuppeteerAuthProviderConfig {
    showAuthWindow?: boolean;
    storageFilePath: string;
    verbose?: boolean;
    puppeteer?: puppeteer.LaunchOptions;
    puppeteerAuthWindow?: puppeteer.LaunchOptions;
}

export class PuppeteerAuthProvider {
    page!: Page;
    lastAuthCookie: string | undefined;
    firstRefresh = true;

    constructor(protected config: PuppeteerAuthProviderConfig) {
        this.config.showAuthWindow = this.config.showAuthWindow ?? true;
        this.config.verbose = this.config.verbose ?? false;
    }

    async openAuthWindow(url: string) {
        if (!this.config.showAuthWindow)
            throw new Error("No window mode enabled");
        const browser = await puppeteer.launch({
            ...this.config.puppeteer,
            headless: false,
            args: ["--app=https://intra.epitech.eu/", "--window-size=1280,720"],
            defaultViewport: {width: 1280, height: 720},
            ...this.config.puppeteerAuthWindow
        });
        const pages = await browser.pages();
        const authPage = pages[0];
        await saveCookies(this.page, this, this.config.storageFilePath);
        await restoreCookies(authPage, this, this.config.storageFilePath);
        await authPage.goto(url);
        await authPage.waitForRequest((res) => res.url().startsWith("https://intra.epitech.eu/"), { timeout: 0 });
        await saveCookies(authPage, this, this.config.storageFilePath);
        await restoreCookies(this.page, this, this.config.storageFilePath);
        await browser.close();
    }

    _print(msg: any) {
        if (this.config.verbose)
            console.log(msg);
    }

    async refresh() {
        if (this.firstRefresh) {
            this.firstRefresh = false;
            const lastSession = getLastAuthCookie(this, this.config.storageFilePath);
            if (lastSession)
                return lastSession;
        }
        const loginBtnSelector = '[href^="https://login.microsoftonline.com/common/oauth2/authorize"]';
        const browser = await puppeteer.launch({
            headless: true,
            ...this.config.puppeteer,
        });

        this.page = await browser.newPage();
        try {
            await restoreCookies(this.page, this, this.config.storageFilePath);
            await this.page.goto("https://intra.epitech.eu/");
            const loginButton = await this.page.$(loginBtnSelector);

            if (loginButton != null) {
                await this.page.click(loginBtnSelector);
                await new Promise((resolve) => setTimeout(resolve, 200));
                await this.page.waitForNetworkIdle();
                const url = this.page.mainFrame().url();
                if (url.startsWith("https://login.microsoftonline.com/")) {
                    this._print("Asking for oauth...");
                    await this.openAuthWindow(url);
                    await this.page.reload();
                    await this.page.waitForNetworkIdle();
                    await saveCookies(this.page, this, this.config.storageFilePath);
                } else {
                    this._print("Auto-auth was successful");
                }
            } else {
                this._print("Already logged in");
            }
        } catch (ex) {
            await this.page.goto("https://intra.epitech.eu/");
            const loginButton = await this.page.$(loginBtnSelector);
            if (loginButton != null) {
                await browser.close();
                throw ex;
            }
        }
        const token = (await this.page.cookies()).find(c => c.name == "user")?.value;
        if (typeof token !== "string") {
            await browser.close();
            throw new Error("token not found");
        }
        this.lastAuthCookie = token;
        await saveCookies(this.page, this, this.config.storageFilePath);
        await browser.close();
        return token;
    }

}

export default PuppeteerAuthProvider;
