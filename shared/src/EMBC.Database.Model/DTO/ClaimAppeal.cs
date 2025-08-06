using System.ComponentModel.DataAnnotations;
using EMBC.Database.Shared.Contract;

namespace EMBC.Database.Model.DTO
{
    public class ClaimAppeal : IDto
    {
        public Guid Id { get; set; }
        public StateCode StateCode { get; set; }
        
        [Required]
        public Guid ClaimId { get; set; }
        
        [Required]
        public string AppealReason { get; set; }
        
        public string? AppealStatus { get; set; }
        
        public DateTime? DateAppealReceived { get; set; }
        
        public DateTime? AppealDecisionDate { get; set; }
        
        public string? AppealDecision { get; set; }
        
        public string? AppealRecommendation { get; set; }
        
        public bool? CreatedOnPortal { get; set; }
        
        public string? AppealAssignedToEmail { get; set; }

        // For invoice-based appeals - store as JSON or separate entities
        public string? InvoiceAppealsJson { get; set; }
    }

    public class InvoiceAppealDto
    {
        public string InvoiceId { get; set; }
        public string AppealReason { get; set; }
        public decimal? AppealAdjustment { get; set; }
    }

    public class ClaimAppealQuery
    {
        public Guid? ClaimId { get; set; }
        public Guid? AppealId { get; set; }
        public string? Status { get; set; }
    }
}
