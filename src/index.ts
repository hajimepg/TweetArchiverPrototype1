#!/usr/bin/env node

import TwitterGateway from "./twitterGateway";

const twitterGateway = new TwitterGateway({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

(async () => {
    const tweet = await twitterGateway.getTweet("hajimepg", "934296995212156928");

    console.log(JSON.stringify(tweet, null, 4));
})()
.catch(
    (error) => console.log(error)
);
