/****** Object:  StoredProcedure [usp_SendNewUpdatePromiseMessagesToWS]    Script Date: 06/18/2015 13:59:36 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_SendNewUpdatePromiseMessagesToWS]') AND type in (N'P', N'PC'))
DROP PROCEDURE [usp_SendNewUpdatePromiseMessagesToWS]
GO

/****** Object:  StoredProcedure [usp_SendNewUpdatePromiseMessagesToWS]    Script Date: 06/18/2015 13:59:36 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_SendNewUpdatePromiseMessagesToWS]') AND type in (N'P', N'PC'))
BEGIN
EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [usp_SendNewUpdatePromiseMessagesToWS] AS' 
END
GO

ALTER PROCEDURE [usp_SendNewUpdatePromiseMessagesToWS] 
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @obj INT
		   ,@sUrl VARCHAR(1000)
		   ,@response VARCHAR(8000)
		   ,@status INT
		   ,@body XML
		   ,@docHandle INT

	-- Don't pass in lat & long to XML
	SET @body = (SELECT [QueueID]
				  ,[DatabaseName]
				  ,[DocumentGUID]
				  ,[DocumentNumber]
				  ,[LocationID]
				  ,[BranchShortID]
				  ,[BranchID]
				  ,[LocationPhone]
				  --,[Latitude]
				  --,[Longitude]
				  ,[TimeZone]
				  ,[ManagerID]
				  ,[ManagerFirstName]
				  ,[ManagerLastName]
				  ,[ManagerEmail]
				  ,[EmployeeID]
				  ,[EmployeeFirstName]
				  ,[EmployeeLastName]
				  ,[EmployeeEmail]
				  ,[EmployeePhone]
				  ,[CustomerID]
				  ,[CustomerFirstName]
				  ,[CustomerLastName]
				  ,[CustomerEmail]
				  ,[CustomerMobile]
				  ,[CustomerHome]
				  ,[CustomerWork]
				  ,[CommPreference]
				  ,[PromiseID]
				  ,[PromiseInsName]
				  ,[PromiseClaimNo]
				  ,[DateQuoted]
				  ,[DateAppointment]
				  ,[IsIssueWithPart]
				  ,[IsUnableToCompleteInstall]
				  --,[ReasonNotCompleted]
				  ,[DateCompleted]
				  ,[VehicleMake]
				  ,[DeleteFlag]
				  ,[InstallerOrder]
				  ,[SubmissionResult]
				  ,[LastUpdated]
			  FROM [UpdatePromiseQueue]
			 WHERE SubmissionResult = 0 FOR XML PATH('Element'), ROOT('PromiseChangeElements'))
	EXEC sp_xml_preparedocument @docHandle OUTPUT, @body; 

	IF EXISTS (SELECT QueueID FROM OPENXML(@docHandle, N'PromiseChangeElements/Element', 2) WITH (QueueID int))
	BEGIN
		-- mark records as in-process status
		UPDATE UpdatePromiseQueue SET SubmissionResult = 1 WHERE QueueID IN (SELECT QueueID FROM OPENXML(@docHandle, N'PromiseChangeElements/Element', 2) WITH (QueueID int))

		-- send XML to web service
		SET @sUrl = 'https://localhost:443/newmessages'
		--SET @sUrl = 'http://localhost:1337/newmessages'

		EXEC sp_OACreate 'MSXML2.ServerXMLHttp', @obj OUT
		EXEC sp_OAMethod @obj, 'Open', NULL, 'post', @sUrl, 'false'
		EXEC sp_OAMethod @obj, 'setRequestHeader', NULL, 'Content-Type', 'application/xml'
		EXEC sp_OAMethod @obj, 'send', NULL, @body
		EXEC sp_OAGetProperty @obj, 'responseText', @response OUT

		-- display results
		SELECT @body [body]

		SELECT @response [response]
		-- update records with success/failure status
		IF (@response = 'true')
			BEGIN
				SET @status = 2
				PRINT 'success!';
			END
		ELSE IF (@response = 'false')
			BEGIN
				SET @status = 3
				PRINT 'failure :(';
			END
		ELSE
			BEGIN
				SET @status = 0
				PRINT 'no response';
			END

		select @status [Status];
	
		UPDATE UpdatePromiseQueue SET SubmissionResult = @status WHERE QueueID IN (SELECT QueueID FROM OPENXML(@docHandle, N'PromiseChangeElements/Element', 2) WITH (QueueID int))

		EXEC sp_OADestroy @obj
	END
	ELSE 
		PRINT 'nothing to send';
	-- Remove the internal representation of the XML document.
	EXEC sp_xml_removedocument @docHandle; 
END

GO

/*
EXEC [usp_SendNewUpdatePromiseMessagesToWS]

select * from UpdatePromiseQueue

UPDATE UpdatePromiseQueue SET SubmissionResult = 0 WHERE QueueID = (select MAX(QueueID) from UpdatePromiseQueue)
UPDATE UpdatePromiseQueue SET DateCompleted = '2015-06-21 17:43:03.593' WHERE QueueID = 2
UPDATE UpdatePromiseQueue SET TimeZone = NULL, Latitude = 60, Longitude = 122 WHERE QueueID = 1
UPDATE UpdatePromiseQueue SET TimeZone = NULL, Latitude = 45.45682000, Longitude = -122.71880000 WHERE QueueID = 1
TRUNCATE TABLE UpdatePromiseQueue
	
*/