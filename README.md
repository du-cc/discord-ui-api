<div align="center">
	<br />
	<p style="font-size: 2em; font-weight: bold">
		discord-ui-api
	</p>
	<br />
</div>

## About

This project interacts with Discord using pure DOM instead of API calls.

## Getting started

1. Paste [bundle.js](./dist/bundle.js) into the console in Devtools

## Example usage

```js
(async () => {
  // Fetching all rendered messages
  discordUI.Messages.fetch();

  // Fetching specific message with id
  // fresh = true: refetch from dom, false: fetch from cache
  discordUI.Messages.fetch("123", true);

  // Sending messages
  await discordUI.Messages.send("Hi from discord ui api!");

  // Sending application commands
  await discordUI.Messages.send("/help", { command: "help" });

  // Listening to new messages
  discordUI.Messages.onMessage((message) => {
    console.log("You got mail!", message);
  });
})();
```

## Known limitations

- Unable to fetch message ID for certain referred message in reply: (Click to see message / Click to see command)

- Only able to fetch messages that are already rendered in DOM

- Some message (especially with embed) will refresh a few times after sent. This cause inaccurate element pointer in embeds
  <details>
    <summary>Workaround</summary>
    <pre>
    discordUI.Messages.onMessage((message) => {
        console.log("You got mail!", message);
        // Fetch the message again freshly after 1 second
        setTimeout(() => {
         const fresh = discordUI.Messages.fetch(message.id, true);
          console.log("Embed", fresh.embeds[0]?.element);
        }, 1000);
     });</pre>
  </details>
