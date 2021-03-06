IF  EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[dbo].[trg_UpdatePromiseChangeRequestDocument]'))
DROP TRIGGER [dbo].[trg_UpdatePromiseChangeRequestDocument]
GO

CREATE TRIGGER [dbo].[trg_UpdatePromiseChangeRequestDocument] 
   ON  [dbo].[Document] 
   FOR INSERT, UPDATE
AS 
BEGIN
	-- =============================================
	-- Author:		Patrick Morganson
	-- Create date: 18 May, 2015
	-- Description:	Call GetUpdatePromiseDataForDocument sproc whenever 
	--				Document is INSERTED, UPDATED with a new DocumentInstallationGUID_FK value
	--				and insert new record in Messaging Queue
	-- =============================================

	-- set up a linked server connection to the database on the 2014 instance
	DECLARE @serverName VARCHAR(40) = N'localhost\SQL2014'
	IF NOT EXISTS(SELECT * FROM sys.servers WHERE NAME = @serverName)
		EXECUTE sp_addlinkedserver @serverName
	
	DECLARE @DocumentGUID uniqueidentifier

	SELECT @DocumentGUID = inserted.DocumentGUID
		  FROM inserted
	LEFT JOIN deleted ON inserted.DocumentGUID = deleted.DocumentGUID
	WHERE (inserted.DocumentInstallationGUID_FK <> deleted.DocumentInstallationGUID_FK OR deleted.DocumentInstallationGUID_FK IS NULL)
	  AND inserted.DocumentInstallationGUID_FK IS NOT NULL

	SET NOCOUNT ON;
	PRINT 'Document GUID: ' + CAST(@DocumentGUID AS VARCHAR(40))
	IF (@DocumentGUID IS NULL)
	BEGIN
		PRINT 'Document Change not found'
	END 
	ELSE
	BEGIN
	    INSERT INTO [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue -- from dbo.Document
	    (
			DatabaseName, 
			DocumentGUID, 
			DocumentNumber, 
			LocationID, 
			BranchShortID, 
			BranchID, 
			LocationPhone, 
			Latitude,
			Longitude,
			ManagerID, 
			ManagerFirstName, 
			ManagerLastName, 
			ManagerEmail, 
			EmployeeID, 
			EmployeeFirstName, 
			EmployeeLastName, 
			EmployeeEmail, 
			EmployeePhone, 
			CustomerID, 
			CustomerFirstName, 
			CustomerLastName, 
			CustomerEmail, 
			CustomerMobile, 
			CustomerHome, 
			CustomerWork, 
			CommPreference, 
			PromiseInsName, 
			PromiseClaimNo, 
			DateQuoted, 
			DateAppointment, 
			IsIssueWithPart,
			IsUnableToCompleteInstall,
			--ReasonNotCompleted, 
			DateCompleted, 
			VehicleMake, 
			DeleteFlag, 
			InstallerOrder, 
			SubmissionResult)
		EXEC dbo.usp_GetUpdatePromiseDataForDocument @DocumentGUID
	END
	
END



		
