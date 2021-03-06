IF  EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[dbo].[trg_UpdatePromiseChangeRequestInstallation]'))
DROP TRIGGER [dbo].[trg_UpdatePromiseChangeRequestInstallation]
GO

CREATE TRIGGER [dbo].[trg_UpdatePromiseChangeRequestInstallation] 
   ON  [dbo].[DocumentInstallation] 
   FOR UPDATE, DELETE
AS 
BEGIN
	-- =============================================
	-- Author:		Patrick Morganson
	-- Create date: 18 May, 2015
	-- Description:	Call usp_GetUpdatePromiseDataForDocument sproc whenever 
	--				DocumentInstallation is UPDATED, or DELETED
	--				and insert new record in Messaging Queue
	-- =============================================

	-- set up a linked server connection to the database on the 2014 instance
	DECLARE @serverName VARCHAR(40) = N'localhost\SQL2014'
	IF NOT EXISTS(SELECT * FROM sys.servers WHERE NAME = @serverName)
		EXECUTE sp_addlinkedserver @serverName
	
	DECLARE @DocumentGUID uniqueidentifier

	SELECT @DocumentGUID = doc.DocumentGUID
		  FROM DocumentInstallation old 
	INNER JOIN Document doc ON doc.DocumentInstallationGUID_FK = old.DocumentInstallationGUID
	INNER JOIN inserted ON old.DocumentInstallationGUID = inserted.DocumentInstallationGUID
	LEFT JOIN deleted ON inserted.DocumentInstallationGUID = deleted.DocumentInstallationGUID
	WHERE inserted.InstallationDate <> deleted.InstallationDate
	   OR inserted.InstallationTime <> deleted.InstallationTime
	   OR inserted.IsIssueWithPart <> deleted.IsIssueWithPart
	   OR inserted.IsUnableToCompleteInstall <> deleted.IsUnableToCompleteInstall
	   OR inserted.JobCompleted <> deleted.JobCompleted

	SET NOCOUNT ON;
	PRINT 'DocInstall DocGUID: ' + CAST(@DocumentGUID AS VARCHAR(40))
	IF (@DocumentGUID IS NULL)
	BEGIN
		PRINT 'DocInstall Change not found'
	END 
	ELSE
	BEGIN
	    INSERT INTO [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue -- from dbo.DocumentInstallation
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



		
