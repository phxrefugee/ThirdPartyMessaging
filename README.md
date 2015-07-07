# ThirdPartyMessaging

Installation
============
After cloning repo, run

'npm install'

Running the App (Grunt)
===============
'grunt'

'grunt serve'

'grunt test'


Global Dependencies: 

* [grunt-cli][gruntjs]
* [bower][bowerio]

Troubleshooting
--------------
[PhantomJS not found][10904]

'sudo apt-get install fontconfig'

[bowerio]: http://bower.io/ "bower package home"
[gruntjs]: http://gruntjs.com/ "grunt package home"
[10904]: https://github.com/ariya/phantomjs/issues/10904 "Github issue"

Minimum version of GlasPacLX: 7.7.1

SQL scripts
--------------
* All SQL scripts are located in /db/sqlScripts folder
* SQL scripts to be executed on SQL instance located on same server as GlasPacLX database
1. CheckUpdatePromiseTableExists.sql
2. usp_SetTimeZoneFromLatLong.sql
3. usp_SendNewUpdatePromiseMessagesToWS.sql \*
4. trg_MessagingQueueUpdatePromiseQueue.sql
5. job_UpdatePromise_CheckForNewMessages.sql

\* confirm URL to web service call is correct in this script

SQL scripts to be executed on GlasPacLX database
1. usp_GetUpdatePromiseDataForDocument.sql
2. trg_UpdatePromiseChangeRequestInstaller.sql \*\*
3. trg_UpdatePromiseChangeRequestInstallation.sql \*\*
4. trg_UpdatePromiseChangeRequestDocument.sql \*\*
5. trg_UpdateDocumentInstallationLastUpdated.sql

\*\* confirm connection to linked server is correct in each of these scripts
