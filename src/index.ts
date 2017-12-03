#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

import { downloadProfileImage } from "./downloadProfileImage";
import * as FileSystemUtil from "./fileSystemUtil";
import TwitterGateway from "./twitterGateway";

const twitterGateway = new TwitterGateway({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

(async () => {
    const tweetId = "936980956044435461";
    const tweet = await twitterGateway.getTweet(tweetId);
    console.log(JSON.stringify(tweet, null, 4));

    const dirName = FileSystemUtil.createDirName(tweet.user.screen_name, tweet.created_at, tweet.id_str);
    fs.mkdirSync(dirName);

    for (const staticFileName of ["normalize.css", "styles.css"]) {
        const src = path.join("./templates", staticFileName);
        const dest = path.join(dirName, staticFileName);

        fs.copyFileSync(src, dest);
    }

    const iconFileName = await downloadProfileImage(tweet.user.profile_image_url, dirName, "icon");

})()
.catch(
    (error) => console.log(error)
);
