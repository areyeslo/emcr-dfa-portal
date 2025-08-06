using AutoMapper;
using EMBC.Database.Model;
using EMBC.Database.Model.DTO;

namespace EMBC.Database.Resources;

public class ClaimAppealMapper : Profile
{
    public ClaimAppealMapper()
    {
        CreateMap<ClaimAppeal, DFA_ClaimAppeal>()
            .ForMember(d => d.DFA_ClaimAppealId, opts => opts.MapFrom(s => s.Id))
            .ForMember(d => d.DFA_OriginClaim, opts => opts.MapFrom(s => new Microsoft.Xrm.Sdk.EntityReference("dfa_projectclaim", s.ClaimId)))
            .ForMember(d => d.DFA_AppealReason, opts => opts.MapFrom(s => s.AppealReason))
            .ForMember(d => d.StatusCode, opts => opts.MapFrom(s => ConvertAppealStatusToStatusCode(s.AppealStatus)))
            .ForMember(d => d.DFA_AppealDecisionDate, opts => opts.MapFrom(s => s.AppealDecisionDate))
            .ForMember(d => d.DFA_AppealDecision, opts => opts.MapFrom(s => ConvertAppealDecisionToOptionSet(s.AppealDecision)))
            .ForMember(d => d.DFA_CreatedOnPortal, opts => opts.MapFrom(s => s.CreatedOnPortal));

        CreateMap<DFA_ClaimAppeal, ClaimAppeal>()
            .ForMember(d => d.Id, opts => opts.MapFrom(s => s.DFA_ClaimAppealId))
            .ForMember(d => d.ClaimId, opts => opts.MapFrom(s => s.DFA_OriginClaim != null ? s.DFA_OriginClaim.Id : Guid.Empty))
            .ForMember(d => d.AppealReason, opts => opts.MapFrom(s => s.DFA_AppealReason))
            .ForMember(d => d.AppealStatus, opts => opts.MapFrom(s => ConvertStatusCodeToAppealStatus(s.StatusCode)))
            .ForMember(d => d.DateAppealReceived, opts => opts.MapFrom(s => s.CreatedOn))
            .ForMember(d => d.AppealDecisionDate, opts => opts.MapFrom(s => s.DFA_AppealDecisionDate))
            .ForMember(d => d.AppealDecision, opts => opts.MapFrom(s => ConvertOptionSetToAppealDecision(s.DFA_AppealDecision)))
            .ForMember(d => d.CreatedOnPortal, opts => opts.MapFrom(s => s.DFA_CreatedOnPortal));
    }

    private static DFA_ClaimAppeal_StatusCode? ConvertAppealStatusToStatusCode(string? status)
    {
        return status?.ToLower() switch
        {
            "submitted" => DFA_ClaimAppeal_StatusCode.Submitted,
            "inprogress" => DFA_ClaimAppeal_StatusCode.InProgress,
            "closed" => DFA_ClaimAppeal_StatusCode.Closed,
            _ => DFA_ClaimAppeal_StatusCode.Submitted
        };
    }

    private static string? ConvertStatusCodeToAppealStatus(DFA_ClaimAppeal_StatusCode? statusCode)
    {
        return statusCode switch
        {
            DFA_ClaimAppeal_StatusCode.Submitted => "Submitted",
            DFA_ClaimAppeal_StatusCode.InProgress => "In Progress",
            DFA_ClaimAppeal_StatusCode.Closed => "Closed",
            _ => "Submitted"
        };
    }

    private static DFA_AppealDecision? ConvertAppealDecisionToOptionSet(string? decision)
    {
        return decision?.ToLower() switch
        {
            "upheld" => DFA_AppealDecision.Upheld,
            "overturned" => DFA_AppealDecision.Overturned,
            "withdrawn" => DFA_AppealDecision.Withdrawn,
            _ => null
        };
    }

    private static string? ConvertOptionSetToAppealDecision(DFA_AppealDecision? decision)
    {
        return decision switch
        {
            DFA_AppealDecision.Upheld => "Upheld",
            DFA_AppealDecision.Overturned => "Overturned", 
            DFA_AppealDecision.Withdrawn => "Withdrawn",
            _ => null
        };
    }
}
