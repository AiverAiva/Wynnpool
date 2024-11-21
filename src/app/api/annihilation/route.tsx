import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path'

const LOCAL_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'annihilation.json');
const GITHUB_ACTION_URL = 'https://api.github.com/repos/AiverAiva/anni-pred/actions/workflows/run_prediction.yml/dispatches';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function readLocalData() {
  try {
    const data = await fs.readFile(LOCAL_DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local data:', error);
    throw new Error('Unable to read local data');
  }
}

async function triggerGitHubWorkflow() {
  try {
    const response = await fetch(GITHUB_ACTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main'
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub workflow dispatch failed: ${response.statusText}`);
    }

    console.log('GitHub workflow dispatched successfully');
  } catch (error) {
    console.error('Error triggering GitHub workflow:', error);
    throw new Error('Unable to trigger GitHub workflow');
  }
}

let workflow_dispatched = false;

export async function GET() {
  try {
    const data = await readLocalData();
    const currentTimestamp = Date.now ();

    // Check if the `current.datetime_utc` has passed
    if (data.current && data.current.datetime_utc <= currentTimestamp) {
      if (!workflow_dispatched) {
        console.log('Triggering GitHub workflow...');
        await triggerGitHubWorkflow();
        // Mark the workflow as dispatched
        workflow_dispatched = true;
        
      } else {
        console.log('Workflow already dispatched for this datetime');
      }
    } else {
      workflow_dispatched = false;
    }

    data.current.workflow_dispatched = workflow_dispatched;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Unable to process request' }, { status: 500 });
  }
}
