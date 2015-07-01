/****** Object:  StoredProcedure [usp_SetTimeZoneFromLatLong]    Script Date: 06/18/2015 13:59:36 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_SetTimeZoneFromLatLong]') AND type in (N'P', N'PC'))
DROP PROCEDURE [usp_SetTimeZoneFromLatLong]
GO

/****** Object:  StoredProcedure [usp_SetTimeZoneFromLatLong]    Script Date: 06/18/2015 13:59:36 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_SetTimeZoneFromLatLong]') AND type in (N'P', N'PC'))
BEGIN
EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [usp_SetTimeZoneFromLatLong] AS' 
END
GO

ALTER PROCEDURE [usp_SetTimeZoneFromLatLong] 
@queueID INT
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @obj INT
		   ,@sUrl VARCHAR(1000)
		   ,@response VARCHAR(8000)
		   ,@docHandle INT
		   ,@latitude VARCHAR(50)
		   ,@longitude VARCHAR(50)
		   ,@timeZone VARCHAR(100)
		   ,@xml XML

	SELECT TOP 1 @latitude = Latitude, @longitude = Longitude FROM UpdatePromiseQueue 
	WHERE QueueID = @queueID		
	  AND ISNULL(TimeZone, '') = ''			-- timezone not already set
	  AND SubmissionResult NOT IN (1, 2)	-- not already 'in-process' (1) or successfully submitted (2)
	
	-- display results for debugging
	SELECT @queueID [queue], @latitude [lat], @longitude [lng]
	
	IF (@latitude IS NOT NULL AND @longitude IS NOT NULL)
	BEGIN
		-- set the status as 'in-process' (1)
		UPDATE UpdatePromiseQueue SET SubmissionResult = 1 WHERE QueueID = @queueID

		-- TODO: store lat/long locally to reduce web service calls 
		-- send XML to web service
		SET @sUrl = 'http://api.geonames.org/timezone?lat=' + @latitude + '&lng=' + @longitude + '&username=patrickm'

		EXEC sp_OACreate 'MSXML2.ServerXMLHttp', @obj OUT
		EXEC sp_OAMethod @obj, 'Open', NULL, 'get', @sUrl, 'false'
		EXEC sp_OAMethod @obj, 'setRequestHeader', NULL, 'Content-Type', 'application/xml'
		EXEC sp_OAMethod @obj, 'send'
		EXEC sp_OAGetProperty @obj, 'responseText', @response OUT

		SET @xml = @response;

		-- display response for debugging
		SELECT @sUrl [url], @response [response], @xml [xml]

		IF (@response IS NOT NULL)
		BEGIN
			-- extract timezoneId node from xml
			SELECT @timeZone = b.value('(timezoneId/text())[1]', 'varchar(50)') 
			FROM @xml.nodes('/geonames/timezone') as a(b) 
			
			-- display result for debugging
			SELECT @timeZone [timezone];
		END
		
		-- update record with timezone, and reset the status to 'new' (0)
		UPDATE UpdatePromiseQueue SET SubmissionResult = 0, TimeZone = @timeZone WHERE QueueID = @QueueID

		EXEC sp_OADestroy @obj
	END
END

GO

/*
EXEC [usp_SetTimeZoneFromLatLong] 1

select * from UpdatePromiseQueue

UPDATE UpdatePromiseQueue SET SubmissionResult = 0 WHERE QueueID = (select MAX(QueueID) from UpdatePromiseQueue)
UPDATE UpdatePromiseQueue SET DateCompleted = '2015-06-21 17:43:03.593' WHERE QueueID = 2
UPDATE UpdatePromiseQueue SET TimeZone = '', SubmissionResult = 0 WHERE QueueID = 3
TRUNCATE TABLE UpdatePromiseQueue

*/