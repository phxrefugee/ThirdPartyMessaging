USE [GlasPacLX_2014]
GO

/****** Object:  Trigger [trgUpdateDocumentInstallationLastUpdated]    Script Date: 06/26/2015 07:48:21 AM ******/
IF  EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[trg_UpdateDocumentInstallationLastUpdated]'))
DROP TRIGGER [trg_UpdateDocumentInstallationLastUpdated]
GO

/****** Object:  Trigger [trg_UpdateDocumentInstallationLastUpdated]    Script Date: 06/26/2015 07:48:21 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TRIGGER [trg_UpdateDocumentInstallationLastUpdated] 
   ON  [DocumentInstallation] 
   AFTER UPDATE
AS 
BEGIN
	-- =============================================
	-- Author:		Patrick Morganson
	-- Create date: 12 June, 2015
	-- Description:	Update LastUpdated value whenever 
	--				DocumentInstallation is UPDATED
	-- =============================================
	UPDATE old
	SET old.LastUpdated = GETDATE()
	FROM DocumentInstallation old
	INNER JOIN inserted ON old.DocumentInstallationGUID = inserted.DocumentInstallationGUID
END
GO


