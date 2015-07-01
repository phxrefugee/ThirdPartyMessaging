-- make sure database exists
USE [master]
GO

/****** Object:  Database [MessagingQueue]    Script Date: 05/18/2015 09:20:56 ******/
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MessagingQueue')
BEGIN
	CREATE DATABASE [MessagingQueue] ON  PRIMARY 
	( NAME = N'MessagingQueue', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL12.SQL2014\MSSQL\DATA\MessagingQueue.mdf' , SIZE = 4096KB , MAXSIZE = UNLIMITED, FILEGROWTH = 1024KB )
	 LOG ON 
	( NAME = N'MessagingQueue_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL12.SQL2014\MSSQL\DATA\MessagingQueue_log.ldf' , SIZE = 1024KB , MAXSIZE = 2048GB , FILEGROWTH = 10%)
	--GO

	ALTER DATABASE [MessagingQueue] SET COMPATIBILITY_LEVEL = 120
	--GO

	IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
	begin
	EXEC [MessagingQueue].[dbo].[sp_fulltext_database] @action = 'enable'
	end
	--GO

	ALTER DATABASE [MessagingQueue] SET ANSI_NULL_DEFAULT OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET ANSI_NULLS OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET ANSI_PADDING OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET ANSI_WARNINGS OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET ARITHABORT OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET AUTO_CLOSE OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET AUTO_CREATE_STATISTICS ON 
	--GO

	ALTER DATABASE [MessagingQueue] SET AUTO_SHRINK OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET AUTO_UPDATE_STATISTICS ON 
	--GO

	ALTER DATABASE [MessagingQueue] SET CURSOR_CLOSE_ON_COMMIT OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET CURSOR_DEFAULT  GLOBAL 
	--GO

	ALTER DATABASE [MessagingQueue] SET CONCAT_NULL_YIELDS_NULL OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET NUMERIC_ROUNDABORT OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET QUOTED_IDENTIFIER OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET RECURSIVE_TRIGGERS OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET  DISABLE_BROKER 
	--GO

	ALTER DATABASE [MessagingQueue] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET DATE_CORRELATION_OPTIMIZATION OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET TRUSTWORTHY OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET ALLOW_SNAPSHOT_ISOLATION OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET PARAMETERIZATION SIMPLE 
	--GO

	ALTER DATABASE [MessagingQueue] SET READ_COMMITTED_SNAPSHOT OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET HONOR_BROKER_PRIORITY OFF 
	--GO

	ALTER DATABASE [MessagingQueue] SET  READ_WRITE 
	--GO

	ALTER DATABASE [MessagingQueue] SET RECOVERY FULL 
	--GO

	ALTER DATABASE [MessagingQueue] SET  MULTI_USER 
	--GO

	ALTER DATABASE [MessagingQueue] SET PAGE_VERIFY CHECKSUM  
	--GO

	ALTER DATABASE [MessagingQueue] SET DB_CHAINING OFF 
END
GO

-- make sure table exists
USE [MessagingQueue]
GO

/****** Object:  Table [dbo].[UpdatePromiseQueue]    Script Date: 05/18/2015 09:23:00 ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdatePromiseQueue]') AND type in (N'U'))
	/****** Object:  Table [dbo].[UpdatePromiseQueue]    Script Date: 05/18/2015 09:23:01 ******/
	BEGIN
	
	-- DROP TABLE [dbo].[UpdatePromiseQueue]
	CREATE TABLE [dbo].[UpdatePromiseQueue](
			QueueID int identity(1,1) NOT NULL,
			DatabaseName varchar(100) NOT NULL, 
			DocumentGUID uniqueidentifier NOT NULL, 
			DocumentNumber varchar(10) NULL,
			LocationID varchar(10) NOT NULL, -- **
			BranchShortID varchar(4) NULL,
			BranchID varchar(20) NULL,
			LocationPhone varchar(30) NULL,
			Latitude decimal(18,8) NOT NULL,
			Longitude decimal(18,8) NOT NULL,
			TimeZone varchar(100) NULL, -- **
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
			PromiseID AS LocationID + '_' + DocumentNumber + '_' + RIGHT('00000' + CONVERT(varchar,ISNULL(QueueID, 1)),6), -- **
			PromiseInsName varchar(50) NULL,
			PromiseClaimNo varchar(30) NULL,
			DateQuoted DateTime NOT NULL, -- **
			DateAppointment DateTime NULL,
			IsIssueWithPart bit NULL,
			IsUnableToCompleteInstall bit NULL,
			DateCompleted DateTime NULL,
			VehicleMake varchar(20) NOT NULL, -- **
			DeleteFlag bit NOT NULL,  -- **
			InstallerOrder integer NOT NULL, 
			SubmissionResult integer NOT NULL,
			LastUpdated DateTime NOT NULL DEFAULT(GETDATE())
	) ON [PRIMARY]
	-- ** Required by Update Promise
	END
GO 

IF  EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[dbo].[trg_MessagingQueueUpdatePromiseQueue]'))
	DROP TRIGGER [dbo].[trg_MessagingQueueUpdatePromiseQueue]
GO
-- =============================================
-- Author:		Patrick Morganson
-- Create date: 24 June, 2015
-- Description:	trigger to call usp_SetTimeZoneFromLatLong stored procedure 
-- that will call web service to populate TimeZone field
-- =============================================
CREATE TRIGGER dbo.trg_MessagingQueueUpdatePromiseQueue 
	ON  dbo.UpdatePromiseQueue 
	AFTER INSERT, UPDATE
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @queueID INT

	SELECT @queueID = inserted.QueueID
	FROM inserted WHERE ISNULL(inserted.TimeZone, '') = ''

	IF (@queueID IS NOT NULL) 
	EXEC dbo.usp_SetTimeZoneFromLatLong @queueID
END

GO

