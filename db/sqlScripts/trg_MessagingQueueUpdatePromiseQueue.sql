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
