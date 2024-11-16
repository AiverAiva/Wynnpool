import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const LOOTPOOL_DATA_FILE = path.join(DATA_DIR, 'lootrun_pool.json');
const HISTORY_DIR = path.join(DATA_DIR, 'history', 'lootrun_pool');
const TOKEN_API_URL = 'https://nori.fish/api/tokens';
const LOOTPOOL_API_URL = 'https://nori.fish/api/lootpool';

async function readLocalData() {
    try {
        const data = await fs.readFile(LOOTPOOL_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

async function writeLocalData(data: any) {
    try {
        await fs.mkdir(HISTORY_DIR, { recursive: true });

        await fs.writeFile(LOOTPOOL_DATA_FILE, JSON.stringify(data, null, 2));
        const historyFile = path.join(HISTORY_DIR, `lootrun_pool_${data.Timestamp}.json`);
        
        await fs.writeFile(historyFile, JSON.stringify(data, null, 2));

        console.log('Data saved successfully and archived in history');
    } catch (error) {
        console.error('Error writing local data:', error);
    }
}

async function fetchTokens() {
    try {
        const response = await fetch(TOKEN_API_URL);
        if (!response.ok) throw new Error(`Token fetch error: ${response.status}`);

        const cookies = response.headers.get('set-cookie');
        if (!cookies) throw new Error('No cookies returned');

        const accessTokenMatch = cookies.match(/access_token=([^;]+);/);
        const csrfTokenMatch = cookies.match(/csrf_token=([^;]+);/);

        return {
            access_token: accessTokenMatch ? accessTokenMatch[1] : '',
            csrf_token: csrfTokenMatch ? csrfTokenMatch[1] : ''
        };
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return null;
    }
}

async function fetchLootpool(accessToken: string, csrfToken: string) {
    try {
        const response = await fetch(LOOTPOOL_API_URL, {
            headers: {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7",
                "Connection": "keep-alive",
                "Content-Type": "application/json",
                "Cookie": `access_token=${accessToken}; csrf_token=${csrfToken}`,
                "Host": "nori.fish",
                "Referer": "https://nori.fish/wynn/item/lootpool/",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
                "X-CSRF-Token": csrfToken,
                "sec-ch-ua": '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"'
            }
        });

        if (!response.ok) throw new Error(`Lootpool fetch error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching lootpool data:', error);
        return null;
    }
}

export async function GET() {
    try {
        let data = await readLocalData();
        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (!data || currentTimestamp >= data.Timestamp+86400*7) {
            console.log('Fetching new data from external API');

            const tokens = await fetchTokens();
            if (!tokens) {
                return NextResponse.json({ error: 'Unable to fetch tokens' }, { status: 500 });
            }

            const newData = await fetchLootpool(tokens.access_token, tokens.csrf_token);
            if (newData) {
                await writeLocalData(newData);
                data = newData;
            } else if (!data) {
                return NextResponse.json({ error: 'Unable to fetch lootpool data' }, { status: 500 });
            }
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error in /api/lootrun-pool endpoint:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
