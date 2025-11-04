import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from "path";
import * as fs from "fs";

function getStaticPath() {
  const cwd = process.cwd();
  // if running from apps/api, go up one level
  if (cwd.endsWith("apps\\api") || cwd.endsWith("apps/api")) {
    return path.resolve(cwd, "../static/item-changelog-data");
  }
  // normal case (running from repo root)
  return path.resolve(cwd, "apps/static/item-changelog-data");
}

@Injectable()
export class ChangelogService {
    private changelogDir = getStaticPath();
    constructor(@InjectModel('item_changelog') private readonly changelogModel: Model<any>) { }

    async getDistinctTimestamps(): Promise<number[]> {
        const files = fs.readdirSync(this.changelogDir);
        return files.map(f => Number(f.replace(".json", ""))).sort((a, b) => b - a);
    }

    async getChangelogByTimestamp(timestamp: number) {
        const filePath = path.join(this.changelogDir, `${timestamp}.json`);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`No changelog found for timestamp ${timestamp}`);
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
}
