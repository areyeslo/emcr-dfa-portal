using EMBC.Database.Model;
using EMBC.Database.Model.DTO;
using EMBC.Database.Shared.Database;
using AutoMapper;

namespace EMBC.Database.Resources;

public interface IClaimAppealRepository : IBaseRepository<ClaimAppeal>
{
    Task<Guid> CreateClaimAppealAsync(ClaimAppeal claimAppeal);
    Task<ClaimAppeal?> GetClaimAppealAsync(Guid appealId);
    Task<IEnumerable<ClaimAppeal>> GetClaimAppealsByClaimAsync(Guid claimId);
    Task<bool> UpdateClaimAppealAsync(ClaimAppeal claimAppeal);
}

public class ClaimAppealRepository : BaseRepository<DFA_ClaimAppeal, ClaimAppeal>, IClaimAppealRepository
{
    private readonly DatabaseContext _databaseContext;

    public ClaimAppealRepository(DatabaseContext databaseContext, IMapper mapper) : base(databaseContext, mapper)
    {
        _databaseContext = databaseContext;
    }

    public async Task<Guid> CreateClaimAppealAsync(ClaimAppeal claimAppeal)
    {
        try
        {
            // Set default values
            claimAppeal.Id = Guid.NewGuid();
            claimAppeal.DateAppealReceived = DateTime.UtcNow;
            claimAppeal.AppealStatus = "Submitted";
            claimAppeal.CreatedOnPortal = true;

            return await Task.FromResult(Insert(claimAppeal));
        }
        catch (Exception ex)
        {
            throw new Exception($"Error creating claim appeal: {ex.Message}", ex);
        }
    }

    public async Task<ClaimAppeal?> GetClaimAppealAsync(Guid appealId)
    {
        try
        {
            return await Task.FromResult(FirstOrDefault(x => x.Id == appealId));
        }
        catch (Exception ex)
        {
            throw new Exception($"Error retrieving claim appeal: {ex.Message}", ex);
        }
    }

    public async Task<IEnumerable<ClaimAppeal>> GetClaimAppealsByClaimAsync(Guid claimId)
    {
        try
        {
            return await Task.FromResult(Where(x => x.ClaimId == claimId));
        }
        catch (Exception ex)
        {
            throw new Exception($"Error retrieving claim appeals: {ex.Message}", ex);
        }
    }

    public async Task<bool> UpdateClaimAppealAsync(ClaimAppeal claimAppeal)
    {
        try
        {
            return await Task.FromResult(Update(claimAppeal));
        }
        catch (Exception ex)
        {
            throw new Exception($"Error updating claim appeal: {ex.Message}", ex);
        }
    }
}
