#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

import * as Nunjucks from "nunjucks";

import { downloadMedia, downloadProfileImage } from "./downloadImage";
import * as FileSystemUtil from "./fileSystemUtil";
import TwitterGateway from "./twitterGateway";

const twitterGateway = new TwitterGateway({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

(async () => {
    const tweetId = "937669009108955136";
    const tweet = await twitterGateway.getTweet(tweetId);
    // console.log(JSON.stringify(tweet, null, 4));

    const dirName = FileSystemUtil.createDirName(tweet.user.screen_name, tweet.created_at, tweet.id_str);
    fs.mkdirSync(dirName);

    for (const staticFileName of ["normalize.css", "styles.css"]) {
        const src = path.join("./templates", staticFileName);
        const dest = path.join(dirName, staticFileName);

        fs.copyFileSync(src, dest);
    }

    const iconFileName = await downloadProfileImage(tweet.user.profile_image_url, dirName, "icon");

    const images = new Array<object>();
    if (tweet.extended_entities !== undefined) {
        let num = 1;
        for (const mediaEntity of tweet.extended_entities.media) {
            const numStr = (num < 10) ? `0${num}` : `${num}`;
            const mediaFileName = await downloadMedia(mediaEntity.media_url, dirName, numStr);

            const imageWidth = mediaEntity.sizes.medium.w;
            const imageHeight = mediaEntity.sizes.medium.h;

            let displayWidth: number;
            let displayHeight: number;

            if (imageWidth >= imageHeight && imageWidth > 400) {
                const resizeRate = imageWidth / 400;
                displayWidth = imageWidth / resizeRate;
                displayHeight = imageHeight / resizeRate;
            }
            else if (imageHeight > imageWidth && imageHeight > 400) {
                const resizeRate = imageHeight / 400;
                displayWidth = imageWidth / resizeRate;
                displayHeight = imageHeight / resizeRate;
            }
            else {
                displayWidth = imageWidth;
                displayHeight = imageHeight;
            }

            images.push({
                fileName: mediaFileName,
                height: displayHeight,
                width: displayWidth
            });

            num++;
        }
    }

    /* tslint:disable:object-literal-sort-keys */
    const data = {
        tweet,
        iconFileName,
        images,
    };
    /* tslint:enable:object-literal-sort-keys */

    const env = Nunjucks.configure("templates");
    const indexFileName = path.join(dirName, "index.html");
    fs.writeFileSync(indexFileName, env.render("index.njk", data));
})()
.catch(
    (error) => console.log(error)
);
