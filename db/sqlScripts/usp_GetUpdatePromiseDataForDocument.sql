/****** Object:  StoredProcedure [usp_GetUpdatePromiseDataForDocument]    Script Date: 06/26/2015 07:23:19 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_GetUpdatePromiseDataForDocument]') AND type in (N'P', N'PC'))
DROP PROCEDURE [usp_GetUpdatePromiseDataForDocument]
GO

/****** Object:  StoredProcedure [usp_GetUpdatePromiseDataForDocument]    Script Date: 06/26/2015 07:23:19 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[usp_GetUpdatePromiseDataForDocument]') AND type in (N'P', N'PC'))
BEGIN
EXEC dbo.sp_executesql @statement = N'CREATE PROCEDURE [usp_GetUpdatePromiseDataForDocument] AS' 
END
GO


ALTER PROCEDURE [usp_GetUpdatePromiseDataForDocument] 
	-- Add the parameters for the stored procedure here
	@DocumentGUID uniqueidentifier
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	SELECT TOP 1000
		DB_NAME() as DatabaseName, 
		doc.DocumentGUID, 
		doc.DocumentNumber,
		LocationID = (SELECT DataListValue FROM DataList WHERE DataListName = 'SerialNo'),
		br.BranchShortID,
		br.BranchID,
		LocationPhone = br.Phone,
		br.Latitude,
		br.Longitude,
		ManagerID = mgr.EmployeeID,
		ManagerFirstName = SUBSTRING(mgr.EmployeeName, 0, CHARINDEX(' ', mgr.EmployeeName)),
		ManagerLastName = SUBSTRING(mgr.EmployeeName, CHARINDEX(' ', mgr.EmployeeName)+1, 50),
		ManagerEmail = mgr.EmailAddress,
		EmployeeID = emp.EmployeeID,
		EmployeeFirstName = SUBSTRING(emp.EmployeeName, 0, CHARINDEX(' ', emp.EmployeeName)),
		EmployeeLastName = SUBSTRING(emp.EmployeeName, CHARINDEX(' ', emp.EmployeeName)+1, 50),
		EmployeeEmail = emp.EmailAddress,
		EmployeePhone = ISNULL(emp.Phone1, ISNULL(emp.Phone2, ISNULL(emp.Phone3, emp.Phone4))),
		CustomerID = cust.CustomerID,
		CustomerFirstName = SUBSTRING(cust.Customer, 0, CHARINDEX(' ', cust.Customer)),
		CustomerLastName = SUBSTRING(cust.Customer, CHARINDEX(' ', cust.Customer)+1, 50),
		CustomerEmail = cust.EMail,
		CustomerMobile = CASE 'Mobile' WHEN cust.PhoneType2 THEN cust.PhoneNumber2 WHEN cust.PhoneType3 THEN cust.PhoneNumber3 WHEN cust.PhoneType4 THEN cust.PhoneNumber4 ELSE cust.PhoneNumber1 END,
		CustomerHome = CASE 'Home' WHEN cust.PhoneType2 THEN cust.PhoneNumber2 WHEN cust.PhoneType3 THEN cust.PhoneNumber3 WHEN cust.PhoneType4 THEN cust.PhoneNumber4 END,
		CustomerWork = CASE 'Work' WHEN cust.PhoneType2 THEN cust.PhoneNumber2 WHEN cust.PhoneType3 THEN cust.PhoneNumber3 WHEN cust.PhoneType4 THEN cust.PhoneNumber4 END,
		CommPreference = ISNULL(cust.MessagingCommPreference_ENUM, 0),
		--PromiseID = (SELECT DataListValue + doc.DocumentNumber FROM DataList WHERE DataListName = 'SerialNo'),
		PromiseInsName = ins.Customer,
		PromiseClaimNo = claim.ClaimNumber,
		DateQuoted = doc.DocumentDateTime,
		DateAppointment = inst.InstallationDate + inst.InstallationTime,
		IsIssueWithPart = inst.IsIssueWithPart,
		IsUnableToCompleteInstall = inst.IsUnableToCompleteInstall,
		DateCompleted = instlr.InstallerPunchOutTime,
		VehicleMake = veh.Make,
		DeleteFlag = doc.IsDeleted, 
		InstallerOrder = MIN(instlr.InstallerOrder), 
		SubmissionResult = 0 -- statusENUM to determine unsent (0), inProcess (1), success (2), failure (3)
	FROM Document doc
	INNER JOIN DocumentInstallation inst ON inst.DocumentInstallationGUID = doc.DocumentInstallationGUID_FK
	INNER JOIN DocumentInstaller instlr ON instlr.DocumentInstallationGUID_FK = doc.DocumentInstallationGUID_FK AND instlr.InstallerOrder = 0
	INNER JOIN Branch br ON doc.BranchGUID_FK = br.BranchGUID
	INNER JOIN Employee mgr ON br.MessagingManagerGUID_FK = mgr.EmployeeGUID
	INNER JOIN Employee emp ON instlr.EmployeeGUID = emp.EmployeeGUID
	INNER JOIN DocumentVehicle veh ON veh.DocumentVehicleGUID = doc.DocumentVehicleGUID_FK
	INNER JOIN DocumentCustomer cust ON cust.DocumentCustomerGUID = doc.CustomerGUID_FK 
	LEFT JOIN CustomerType isCust ON isCust.CustomerTypeGUID = cust.CustomerTypeGUID_FK AND isCust.TreatAsTypeOF_ENUM IN (1,4)
	LEFT JOIN DocumentCustomer ins ON ins.DocumentCustomerGUID = doc.InsuranceGUID_FK 
	LEFT JOIN CustomerType isIns ON isIns.CustomerTypeGUID = ins.CustomerTypeGUID_FK AND isIns.TreatAsTypeOF_ENUM IN (2,3)
	LEFT JOIN DocumentClaimData claim ON claim.DocumentClaimDataGUID = doc.DocumentClaimDataGUID_FK
	WHERE doc.DocumentGUID = @DocumentGUID
	GROUP BY 
		doc.DocumentGUID, 
		doc.DocumentNumber,
		br.BranchShortID,
		br.BranchID,
		br.Phone,
		br.Latitude,
		br.Longitude,
		mgr.EmployeeID,
		mgr.EmployeeName,
		mgr.EmailAddress,
		emp.EmployeeID,
		emp.EmployeeName,
		emp.EmailAddress,
		emp.Phone1, 
		emp.Phone2, 
		emp.Phone3, 
		emp.Phone4,
		cust.CustomerID,
		cust.Customer,
		cust.EMail,
		cust.PhoneType2,
		cust.PhoneNumber2,
		cust.PhoneType3,
		cust.PhoneNumber3,
		cust.PhoneType4,
		cust.PhoneNumber4,
		cust.PhoneNumber1,
		cust.MessagingCommPreference_ENUM,
		doc.DocumentNumber,
		ins.Customer,
		claim.ClaimNumber,
		doc.DocumentDateTime,
		inst.InstallationDate,
		inst.InstallationTime,
		inst.IsIssueWithPart,
		inst.IsUnableToCompleteInstall,
		instlr.InstallerPunchOutTime,
		veh.Make,
		doc.IsDeleted
	ORDER BY doc.DocumentNumber
	
	Print 'GetUpdatePromiseDataForDocument() sproc call works';
END

GO


