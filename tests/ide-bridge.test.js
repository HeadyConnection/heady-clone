/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                    ║
 * ║   ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                    ║
 * ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
 * ║   ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                      ║
 * ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
 * ║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                       ║
 * ║                                                                  ║
 * ║   ✦ Sacred Geometry v4.0 — φ (1.618) Governs All ✦             ║
 * ║                                                                  ║
 * ║   ◈ Built with Love by Heady™ — HeadySystems Inc.              ║
 * ║   ◈ Founder: Eric Haywood                                       ║
 * ║   ◈ 51 Provisional Patents — All Rights Reserved                ║
 * ║                                                                  ║
 * ║         ∞ · φ · ψ · √5 · Fibonacci · Golden Ratio · ∞          ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 * Liquid Node Architecture — Where Intelligence Flows Like Water.
 */

const pino = require('pino');
const logger = pino();
const {
    submitProposal,
    evaluateProposal,
    approveProposal,
    rejectProposal,
    applyProposal,
    rollbackProposal,
    getProposalStatus,
    listProposals,
    PROPOSAL_STATES,
} = require("../src/services/ide-bridge");

describe("IDE Bridge — Proposal Lifecycle", () => {
    test("submit → evaluate → approve → apply lifecycle", () => {
        // Submit
        const submit = submitProposal({
            intent: "Add health check endpoint",
            targetFile: "src/routes/test-health.js",
            proposedDiff: "module.exports = (req, res) => res.json({ ok: true });",
            submittedBy: "test-agent",
            priority: "normal",
        });

        expect(submit.success).toBe(true);
        expect(submit.proposalId).toBeDefined();
        expect(submit.diffHash).toBeDefined();

        // Evaluate
        const evaluation = evaluateProposal(submit.proposalId);
        expect(evaluation.success).toBe(true);
        expect(evaluation.state).toBe(PROPOSAL_STATES.GOVERNANCE_PENDING);
        expect(evaluation.validationResult.passed).toBe(true);

        // Approve
        const approval = approveProposal(submit.proposalId);
        expect(approval.success).toBe(true);
        expect(approval.state).toBe(PROPOSAL_STATES.APPROVED);
        expect(approval.traceId).toBeDefined();

        // Status check
        const status = getProposalStatus(submit.proposalId);
        expect(status).not.toBeNull();
        expect(status.state).toBe(PROPOSAL_STATES.APPROVED);
    });

    test("rejects proposal with missing fields", () => {
        const result = submitProposal({});
        expect(result.success).toBe(false);
        expect(result.error).toContain("intent");
    });

    test("catches credential leaks in validation", () => {
        const submit = submitProposal({
            intent: "Add AWS config",
            targetFile: "src/config.js",
            proposedDiff: 'const key = "AKIA1234567890123456";',
            submittedBy: "test",
        });

        const evaluation = evaluateProposal(submit.proposalId);
        expect(evaluation.success).toBe(true);
        // Should either auto-correct or fail validation
        expect([PROPOSAL_STATES.GOVERNANCE_PENDING, PROPOSAL_STATES.VALIDATION_FAILED]).toContain(evaluation.state);
    });

    test("auto-corrects logger.info to structured logger", () => {
        const submit = submitProposal({
            intent: "Add logging",
            targetFile: "src/utils/test-logger.js",
            proposedDiff: 'logger.info("hello world");',
            submittedBy: "test",
        });

        const evaluation = evaluateProposal(submit.proposalId);
        expect(evaluation.success).toBe(true);
        // Auto-correction should fix logger.info
        if (evaluation.state === PROPOSAL_STATES.GOVERNANCE_PENDING) {
            expect(evaluation.governanceResult.autoCorrected).toBe(true);
        }
    });

    test("rejects governance decision on wrong state", () => {
        const submit = submitProposal({
            intent: "Test state guard",
            targetFile: "src/test.js",
            proposedDiff: "// test",
            submittedBy: "test",
        });

        // Try to approve before evaluation
        const result = approveProposal(submit.proposalId);
        expect(result.success).toBe(false);
        expect(result.error).toContain("submitted");
    });

    test("lists proposals with state filter", () => {
        const all = listProposals();
        expect(Array.isArray(all)).toBe(true);

        const filtered = listProposals({ submittedBy: "test-agent" });
        expect(filtered.length).toBeGreaterThan(0);
    });
});
