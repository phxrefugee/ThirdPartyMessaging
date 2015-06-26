IF  EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[dbo].[trg_UpdatePromiseChangeRequestInstaller]'))
DROP TRIGGER [dbo].[trg_UpdatePromiseChangeRequestInstaller]
GO

CREATE TRIGGER [dbo].[trg_UpdatePromiseChangeRequestInstaller] 
   ON  [dbo].[DocumentInstaller] 
   FOR INSERT, UPDATE, DELETE
AS 
BEGIN
	-- =============================================
	-- Author:		Patrick Morganson
	-- Create date: 18 May, 2015
	-- Description:	Call usp_GetUpdatePromiseDataForDocument sproc whenever 
	--				PRIMARY DocumentInstaller is INSERTED, UPDATED, or DELETED
	--				and insert new record in Messaging Queue if timestamp difference 
	--				from DocumentInstallation record is greater than 10 seconds.
	--				Otherwise, update existing Messaging Queue record.
	-- =============================================

	-- set up a linked server connection to the database on the 2014 instance
	DECLARE @serverName VARCHAR(40) = N'localhost\SQL2014'
	IF NOT EXISTS(SELECT * FROM sys.servers WHERE NAME = @serverName)
		EXECUTE sp_addlinkedserver @serverName

	DECLARE @DocumentGUID uniqueidentifier
		   ,@priorUpdated datetime
		   ,@newUpdated datetime
		   ,@installer varchar(40)

	SELECT TOP 1 @DocumentGUID = doc.DocumentGUID
		  ,@newUpdated = inserted.LastUpdated
		  ,@priorUpdated = install.LastUpdated
		  ,@installer = inserted.Installer
		  FROM DocumentInstaller old 
	INNER JOIN DocumentInstallation install ON old.DocumentInstallationGUID_FK = install.DocumentInstallationGUID
	INNER JOIN Document doc ON doc.DocumentInstallationGUID_FK = old.DocumentInstallationGUID_FK 
	INNER JOIN inserted ON old.DocumentInstallationGUID_FK = inserted.DocumentInstallationGUID_FK AND inserted.InstallerOrder = 0 -- only get primary installer
	INNER JOIN deleted ON inserted.DocumentInstallationGUID_FK = deleted.DocumentInstallationGUID_FK AND deleted.InstallerOrder = 0 
	WHERE inserted.InstallerPunchOutTime <> deleted.InstallerPunchOutTime
	   OR inserted.InstallerOrder <> deleted.InstallerOrder
	   OR inserted.DocumentInstallerGUID <> deleted.DocumentInstallerGUID

	SET NOCOUNT ON;
	PRINT 'Installer DocGUID: ' + CAST(@DocumentGUID AS VARCHAR(40))
	IF (@DocumentGUID IS NULL)
	BEGIN
		PRINT 'Installer change not found'
	END
	ELSE
	BEGIN
		-- if the timestamp on DocumentInstallation record is less than 1 second difference, 
		-- update the existing Messaging Queue record. 
		-- otherwise, insert a new Messaging Queue record
		PRINT 'check time difference'
		IF (DATEDIFF(SS, @priorUpdated, @newUpdated) >	1)
		BEGIN
			PRINT 'Inserting new record'
			INSERT INTO [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue -- from dbo.DocumentInstaller
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
				ReasonNotCompleted, 
				DateCompleted, 
				VehicleMake, 
				DeleteFlag, 
				InstallerOrder, 
				SubmissionResult)
			EXEC dbo.usp_GetUpdatePromiseDataForDocument @DocumentGUID
		END
		ELSE
		BEGIN
			PRINT 'Updating existing record with timestamp ' + CAST(@priorUpdated AS varchar(100))
			DECLARE @queueID int
			-- get the latest record for this document
			SELECT TOP 1 @queueID = QueueID from [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue
			WHERE DocumentGUID = @DocumentGUID --AND @newUpdated > LastUpdated
			ORDER BY LastUpdated DESC
			PRINT 'QueueID = ' + CAST(@queueID AS VARCHAR(10))
			SELECT QueueID = @queueID
			-- create a temp table to hold sproc results
			CREATE TABLE [dbo].[tmpUpdatePromiseQueue](
					--QueueID int identity(1,1) NOT NULL,
					DatabaseName varchar(100) NOT NULL, 
					DocumentGUID uniqueidentifier NOT NULL, 
					DocumentNumber varchar(10) NULL,
					LocationID varchar(10) NOT NULL, -- **
					BranchShortID varchar(4) NULL,
					BranchID varchar(20) NULL,
					LocationPhone varchar(30) NULL,
					Latitude decimal(18,8) NOT NULL, -- **
					Longitude decimal(18,8) NOT NULL, -- **
					ManagerID varchar(20) NULL,
					ManagerFirstName varchar(50) NOT NULL, -- **
					ManagerLastName varchar(50) NOT NULL, -- **
					ManagerEmail varchar(50) NOT NULL, -- **
					EmployeeID varchar(20) NULL,
					EmployeeFirstName varchar(50) NOT NULL, -- **
					EmployeeLastName varchar(50) NOT NULL, -- **
					EmployeeEmail varchar(50) NOT NULL, -- **
					EmployeePhone varchar(30) NULL,
					CustomerID varchar(50) NULL,
					CustomerFirstName varchar(50) NOT NULL, -- **
					CustomerLastName varchar(50) NOT NULL, -- **
					CustomerEmail varchar(100) NULL,
					CustomerMobile varchar(30) NULL,
					CustomerHome varchar(30) NULL,
					CustomerWork varchar(30) NULL,
					CommPreference integer NOT NULL, -- **
					--PromiseID AS LocationID + DocumentNumber + RIGHT('' + CONVERT(varchar,ISNULL(QueueID, 1)),6), -- **
					PromiseInsName varchar(50) NULL,
					PromiseClaimNo varchar(30) NULL,
					DateQuoted DateTime NOT NULL, -- **
					DateAppointment DateTime NULL,
					ReasonNotCompleted int NULL,
					DateCompleted DateTime NULL,
					VehicleMake varchar(20) NOT NULL, -- **
					DeleteFlag bit NOT NULL,  -- **
					InstallerOrder integer NOT NULL, 
					SubmissionResult integer NOT NULL
			) ON [PRIMARY]
			
			-- call sproc and insert values into temp table
			INSERT INTO [tmpUpdatePromiseQueue] EXEC dbo.usp_GetUpdatePromiseDataForDocument @DocumentGUID
			-- see if temp table got populated
			SELECT * FROM [tmpUpdatePromiseQueue]
			-- update existing record with new values
			UPDATE [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue 
			SET 
				EmployeeID = tmp.EmployeeID,
				EmployeeFirstName = tmp.EmployeeFirstName,
				EmployeeLastName = tmp.EmployeeLastName,
				EmployeeEmail = tmp.EmployeeEmail,
				EmployeePhone = tmp.EmployeePhone,
				DateAppointment = tmp.DateAppointment,
				ReasonNotCompleted = tmp.ReasonNotCompleted,
				DateCompleted = tmp.DateCompleted,
				LastUpdated = GETDATE()
			FROM tmpUpdatePromiseQueue as tmp
			WHERE UpdatePromiseQueue.QueueID = @queueID
			-- drop temp table
			DROP TABLE [tmpUpdatePromiseQueue]

			/*
			SELECT * from [localhost\SQL2014].MessagingQueue.dbo.UpdatePromiseQueue
			WHERE DocumentGUID = @DocumentGUID 
			ORDER BY LastUpdated DESC
			*/
		END
	END 
END

