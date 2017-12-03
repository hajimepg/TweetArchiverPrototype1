import * as fs from "fs";

import * as DateFns from "date-fns";

export function createDirName(screenName: string, tweetAt: string, tweetId: string): string {
    const tweetDate: string = DateFns.format(DateFns.parse(tweetAt), "YYYY-MM-DD");

    const baseDirName = `./${screenName}-${tweetDate}-${tweetId}`;

    let dirName: string;
    for (let i = 0; ; i++) {
        if (i === 0) {
            dirName = baseDirName;
        }
        else {
            dirName = `${baseDirName}_${i}`;
        }

        if (fs.existsSync(dirName) === false) {
            break;
        }
    }

    return dirName;
}
