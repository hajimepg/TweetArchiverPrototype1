#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import * as Commander from "commander";
import * as Nunjucks from "nunjucks";
import * as TwitterText from "twitter-text";

import { downloadMedia, downloadProfileImage } from "./downloadImage";
import * as FileSystemUtil from "./fileSystemUtil";
import TwitterGateway from "./twitterGateway";

const commandLineParser = Commander
    .version("0.0.1")
    .arguments("<tweet_url>");

commandLineParser.parse(process.argv);

if (commandLineParser.args.length === 0) {
    commandLineParser.help();
    process.exit(1);
}

const tweetUrl = url.parse(commandLineParser.args[0]);
if (tweetUrl.hostname !== "twitter.com" || tweetUrl.pathname === undefined) {
    commandLineParser.help();
    process.exit(1);
}

const tweetPathNameRegExp = /^\/[\w\d]+\/status\/(\d+)$/;
const tweetPathNameRegExpResult = tweetPathNameRegExp.exec((tweetUrl.pathname as string));

if (tweetPathNameRegExpResult === null) {
    commandLineParser.help();
    process.exit(1);
}

const tweetId = (tweetPathNameRegExpResult as RegExpExecArray)[1];

const twitterGateway = new TwitterGateway({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

(async () => {
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
        text: TwitterText.autoLink(tweet.text, { urlEntities: tweet.entities.urls }),
    };
    /* tslint:enable:object-literal-sort-keys */

    const env = Nunjucks.configure("templates");
    const indexFileName = path.join(dirName, "index.html");
    fs.writeFileSync(indexFileName, env.render("index.njk", data));
})()
.catch(
    (error) => console.log(error)
);
