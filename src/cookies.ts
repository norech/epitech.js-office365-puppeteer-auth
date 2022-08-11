import fs from "fs";
import puppeteer from 'puppeteer';
import PuppeteerAuthProvider from ".";


export async function getLastAuthCookie(provider: PuppeteerAuthProvider, cookiesPath: string) {
    if (!fs.existsSync(cookiesPath)) {
        provider._print("No cookies to restore.");
        return;
    }
    try {
        let buf = fs.readFileSync(cookiesPath);
        let content = JSON.parse(buf.toString());
        provider._print("Restoring last auth cookie");
        return content.lastAuthCookie;
    } catch (e) {
        provider._print("Error while restoring last auth cookie");
    }
    return undefined;
}

export async function saveCookies(page: puppeteer.Page, provider: PuppeteerAuthProvider, cookiesPath: string) {
    const client = await page.target().createCDPSession();
    const cookies = (await client.send("Network.getAllCookies"))["cookies"];
    provider._print("Writing cookies");
    fs.writeFileSync(cookiesPath, JSON.stringify({
        lastAuthCookie: provider.lastAuthCookie,
        cookies
    }));
}

export async function restoreCookies(page: puppeteer.Page, provider: PuppeteerAuthProvider, cookiesPath: string) {
    if (!fs.existsSync(cookiesPath)) {
        provider._print("No cookies to restore.");
        return;
    }
    try {
        let buf = fs.readFileSync(cookiesPath);
        let content = JSON.parse(buf.toString());
        let cookies = content.cookies;
        provider._print("Restoring cookies");
        provider.lastAuthCookie = content.lastAuthCookie;
        await page.setCookie(...cookies);
    } catch (err) {
        provider._print("Can't restore cookies");
        provider._print(err);
    }
}
