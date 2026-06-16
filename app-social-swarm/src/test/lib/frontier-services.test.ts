import { describe, it, expect, vi } from 'vitest';
import { createMockServices } from '../../lib/frontier-services';

describe('createMockServices', () => {
  it('returns wallet, user, and swarm services', () => {
    const services = createMockServices();
    expect(services.wallet).toBeDefined();
    expect(services.user).toBeDefined();
    expect(services.swarm).toBeDefined();
  });

  it('returns formatted balance', async () => {
    const services = createMockServices();
    const balance = await services.wallet.getBalanceFormatted();
    expect(balance.total).toBeDefined();
    expect(balance.fnd).toBeDefined();
    expect(balance.internalFnd).toBeDefined();
    expect(parseFloat(balance.total)).toBeGreaterThan(0);
  });

  it('returns user details', async () => {
    const services = createMockServices();
    const user = await services.user.getDetails();
    expect(user.walletAddress).toBeDefined();
    expect(user.displayName).toBeDefined();
  });

  it('listCampaigns returns pre-seeded campaigns', async () => {
    const services = createMockServices();
    const campaigns = await services.swarm.listCampaigns();
    expect(campaigns.length).toBeGreaterThan(0);
    for (const campaign of campaigns) {
      expect(campaign.title).toBeDefined();
      expect(campaign.platforms.length).toBeGreaterThan(0);
    }
  });

  it('createCampaign adds a campaign and returns it', async () => {
    const services = createMockServices();
    const before = await services.swarm.listCampaigns();

    const newCampaign = await services.swarm.createCampaign({
      title: 'Test Campaign',
      brief: 'A brief for the test campaign that is long enough to pass validation',
      targetAudience: 'Web3 developers',
      platforms: ['twitter', 'linkedin'],
      tone: 'Professional',
    });

    expect(newCampaign.title).toBe('Test Campaign');
    expect(newCampaign.status).toBe('draft');
    expect(newCampaign.contentCount).toBe(0);
    expect(newCampaign.totalCost).toBe('0.00');

    const after = await services.swarm.listCampaigns();
    expect(after.length).toBe(before.length + 1);
  });

  it('getCampaign returns null for unknown id', async () => {
    const services = createMockServices();
    const result = await services.swarm.getCampaign('nonexistent-id');
    expect(result).toBeNull();
  });

  it('listContent returns pre-seeded content', async () => {
    const services = createMockServices();
    const content = await services.swarm.listContent();
    expect(content.length).toBeGreaterThan(0);
    for (const piece of content) {
      expect(piece.platform).toBeDefined();
      expect(piece.copy).toBeDefined();
      expect(piece.hashtags).toBeInstanceOf(Array);
    }
  });

  it('listContent filters by platform', async () => {
    const services = createMockServices();
    const twitterContent = await services.swarm.listContent(undefined, 'twitter');
    expect(twitterContent.every((c) => c.platform === 'twitter')).toBe(true);
  });

  it('listContent filters by campaignId', async () => {
    const services = createMockServices();
    const allContent = await services.swarm.listContent();
    if (allContent.length === 0) return;
    const campaignId = allContent[0].campaignId;
    const filtered = await services.swarm.listContent(campaignId);
    expect(filtered.every((c) => c.campaignId === campaignId)).toBe(true);
  });

  it('scheduleContent sets scheduledFor', async () => {
    const services = createMockServices();
    const content = await services.swarm.listContent();
    const piece = content[0];
    const scheduledFor = '2026-04-01T09:00:00.000Z';

    const updated = await services.swarm.scheduleContent(piece.id, scheduledFor);
    expect(updated.scheduledFor).toBe(scheduledFor);
  });

  it('publishContent marks piece as published', async () => {
    const services = createMockServices();
    const content = await services.swarm.listContent();
    const piece = content.find((c) => !c.isPublished);
    if (!piece) return;

    const updated = await services.swarm.publishContent(piece.id);
    expect(updated.isPublished).toBe(true);
    expect(updated.scheduledFor).toBeNull();
  });

  it('deleteCampaign removes campaign and its content', async () => {
    const services = createMockServices();
    const campaigns = await services.swarm.listCampaigns();
    const target = campaigns[0];

    await services.swarm.deleteCampaign(target.id);

    const after = await services.swarm.listCampaigns();
    expect(after.find((c) => c.id === target.id)).toBeUndefined();

    const contentAfter = await services.swarm.listContent(target.id);
    expect(contentAfter.length).toBe(0);
  });

  it('listSwarmAgents returns 5 agents', async () => {
    const services = createMockServices();
    const agents = await services.swarm.listSwarmAgents();
    expect(agents.length).toBe(5);
    for (const agent of agents) {
      expect(agent.role).toBeDefined();
      expect(agent.pricePerRun).toBeDefined();
      expect(agent.isActive).toBe(true);
    }
  });

  it('getPaymentHistory returns pre-seeded payments', async () => {
    const services = createMockServices();
    const payments = await services.swarm.getPaymentHistory();
    expect(payments.length).toBeGreaterThan(0);
    for (const payment of payments) {
      expect(payment.transactionHash).toMatch(/^0x[0-9a-f]+$/);
      expect(payment.status).toBe('success');
    }
  });

  it('recordPayment adds to payment history', async () => {
    const services = createMockServices();
    const before = await services.swarm.getPaymentHistory();

    await services.swarm.recordPayment({
      campaignId: 'campaign-test',
      campaignTitle: 'Test Campaign',
      amount: '0.23',
      transactionHash: '0x' + 'a'.repeat(64),
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    const after = await services.swarm.getPaymentHistory();
    expect(after.length).toBe(before.length + 1);
  });
});

describe('wallet transferOverallFrontierDollar mock', () => {
  it('resolves with a successful receipt', async () => {
    const services = createMockServices();
    const receipt = await services.wallet.transferOverallFrontierDollar(
      '0x1234567890123456789012345678901234567890',
      '0.23',
    );
    expect(receipt.success).toBe(true);
    expect(receipt.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('logs the transfer', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const services = createMockServices();
    await services.wallet.transferOverallFrontierDollar(
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      '0.23',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('0.23 FND'),
    );
    consoleSpy.mockRestore();
  });
});
