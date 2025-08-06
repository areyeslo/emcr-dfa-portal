using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using EMBC.DFA.API.Services;
using EMBC.Database.Resources;
using EMBC.Database.Model.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace EMBC.DFA.API.Controllers
{
    /// <summary>
    /// Controller for managing public claim appeals.
    /// </summary>
    [Route("api/claimappeals")]
    [ApiController]
    [Authorize]
    public class ClaimAppealController : ControllerBase
    {
        private readonly IHostEnvironment env;
        private readonly IMapper mapper;
        private readonly IClaimAppealRepository claimAppealRepository;
        private readonly IUserService userService;

        public ClaimAppealController(
            IHostEnvironment env,
            IMapper mapper,
            IClaimAppealRepository claimAppealRepository,
            IUserService userService)
        {
            this.env = env;
            this.mapper = mapper;
            this.claimAppealRepository = claimAppealRepository;
            this.userService = userService ?? throw new ArgumentNullException(nameof(userService));
        }

        private string currentUserId => User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        /// <summary>
        /// Submit a claim appeal with invoice details
        /// </summary>
        /// <param name="request">The claim appeal request with invoice appeals</param>
        /// <returns>appeal id</returns>
        [HttpPost("submit")]
        [ProducesResponseType(typeof(ClaimAppealResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SubmitClaimAppeal([FromBody] SubmitClaimAppealRequest request)
        {
            if (request == null || !request.SelectedInvoices?.Any() == true) 
                return BadRequest("Appeal request cannot be empty and must include selected invoices.");

            try
            {
                // Map the request to the shared DTO using AutoMapper
                var claimAppeal = mapper.Map<ClaimAppeal>(request);
                
                var appealId = await claimAppealRepository.CreateClaimAppealAsync(claimAppeal);
                
                // Map the response using AutoMapper
                var response = mapper.Map<ClaimAppealResponse>(claimAppeal);
                response.AppealId = appealId.ToString();
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error submitting claim appeal: {ex.Message}");
            }
        }

        /// <summary>
        /// Retrieve a claim appeal by ID
        /// </summary>
        /// <param name="id">The claim appeal id</param>
        /// <returns>The claim appeal information</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ClaimAppeal), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetClaimAppeal(Guid id)
        {
            try
            {
                var claimAppeal = await claimAppealRepository.GetClaimAppealAsync(id);
                if (claimAppeal == null) return NotFound();
                
                return Ok(claimAppeal);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving claim appeal: {ex.Message}");
            }
        }

        /// <summary>
        /// Get claim appeals for a specific claim
        /// </summary>
        /// <param name="claimId">The claim ID</param>
        /// <returns>List of claim appeals</returns>
        [HttpGet("byclaim/{claimId}")]
        [ProducesResponseType(typeof(List<ClaimAppeal>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetClaimAppealsByClaim(Guid claimId)
        {
            try
            {
                var claimAppeals = await claimAppealRepository.GetClaimAppealsByClaimAsync(claimId);
                return Ok(claimAppeals);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving claim appeals: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Request model for submitting claim appeals
    /// </summary>
    public class SubmitClaimAppealRequest
    {
        [Required]
        public string ClaimId { get; set; }
        
        [Required]
        public List<InvoiceAppealRequest> SelectedInvoices { get; set; }
    }

    public class InvoiceAppealRequest
    {
        [Required]
        public string InvoiceId { get; set; }
        
        [Required]
        public string AppealReason { get; set; }
        
        public decimal? AppealAdjustment { get; set; }
    }

    public class ClaimAppealResponse
    {
        public string AppealId { get; set; }
        public string Message { get; set; }
    }
}
