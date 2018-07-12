# nagbot-slack

## Usage
This bot will make a request to a Google Sheets script and retrieve a list of emails corresponding to Slack users in the workspace it resides in. It will then send a daily direct message to every user with an attachment until that user's email has been cleared from the list.

**Possible Use**: Remind Slack users to fill out a form that posts to a Google Sheets spreadsheet that requires weekly submissions. If a user has already completed their weekly submission, the bot will stop reminding the user that week. Otherwise, the bot will continue to remind the user.

## Setup
1. Fork this project.
2. Open up your favorite terminal app, and clone your new repository to your local computer.
3. This is a Node.js project, so you’ll need to install the various dependencies by running:
    npm install
4. Edit `package.json` to give your bot a name and update the GitHub URLs to reflect the location of your fork in GitHub.
5. Go to https://api.slack.com/apps and create an app for your workspace
6. Add an incoming webhook and a bot user
7. Obtain your script URL and your form URL from the Google Apps Script script editor of your form and your form's web page.
7. Create a .env file and fill out the following:

    ```text
		CLIENT_ID=
		CLIENT_SECRET=
		PORT=
		BOT_TOKEN=
		WEBHOOK_URL=
		SCRIPT_URL=
		FORM_URL=
    ```

8. Run `npm start` in your terminal to run the bot locally.
