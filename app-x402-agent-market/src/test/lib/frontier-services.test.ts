import { describe, it, expect, vi } from 'vitest';
import { createMockServices } from '../../lib/frontier-services';

describe('createMockServices', () => {
  it('returns wallet, user, and agents services', () => {
    const services = createMockServices();
    expect(services.wallet).toBeDefined();
    expect(services.user).toBeDefined();
    expect(services.agents).toBeDefined();
  });

  it('returns formatted balance', async () => {
    const services = createMockServices();
    const balance = await services.wallet.getBalanceFormatted();
    expect(balance.total).toBeDefined();
    expect(balance.fnd).toBeDefined();
    expect(balance.internalFnd).toBeDefined();
  });

  it('returns user details', async () => {
    const services = createMockServices();
    const user = await services.user.getDetails();
    expect(user.walletAddress).toBeDefined();
    expect(user.displayName).toBeDefined();
  });

  it('listAgents returns agents', async () => {
    const services = createMockServices();
    const agents = await services.agents.listAgents();
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent.isActive).toBe(true);
      expect(agent.pricePerCall).toBeDefined();
    }
  });

  it('registerAgent adds agent and returns it', async () => {
    const services = createMockServices();
    const before = await services.agents.listAgents();

    const newAgent = await services.agents.registerAgent({
      name: 'Test Agent',
      description: 'A test agent',
      longDescription: 'A longer description for test agent',
      category: 'ai-assistant',
      endpoint: 'https://test.example.com/invoke',
      pricePerCall: '0.01',
      paymentAddress: '0x1234567890123456789012345678901234567890',
      tags: ['test'],
    });

    expect(newAgent.name).toBe('Test Agent');
    expect(newAgent.isActive).toBe(true);
    expect(newAgent.callCount).toBe(0);

    const after = await services.agents.listAgents();
    expect(after.length).toBe(before.length + 1);
  });

  it('getAgent returns null for unknown id', async () => {
    const services = createMockServices();
    const result = await services.agents.getAgent('nonexistent-id');
    expect(result).toBeNull();
  });

  it('deleteAgent removes agent from listing', async () => {
    const services = createMockServices();
    const before = await services.agents.listAgents();
    const agentToDelete = before[0];

    await services.agents.deleteAgent(agentToDelete.id);

    const after = await services.agents.listAgents();
    expect(after.find((a) => a.id === agentToDelete.id)).toBeUndefined();
  });

  it('recordPayment increments agent call count', async () => {
    const services = createMockServices();
    const agents = await services.agents.listAgents();
    const agent = agents[0];
    const initialCount = agent.callCount;

    await services.agents.recordPayment({
      agentId: agent.id,
      agentName: agent.name,
      amount: agent.pricePerCall,
      transactionHash: '0xabc123',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    const updated = await services.agents.getAgent(agent.id);
    expect(updated?.callCount).toBe(initialCount + 1);
  });

  it('getPaymentHistory filters by agentId', async () => {
    const services = createMockServices();
    const allPayments = await services.agents.getPaymentHistory();
    if (allPayments.length === 0) return; // No payments yet in fresh store

    const firstAgentId = allPayments[0].agentId;
    const filtered = await services.agents.getPaymentHistory(firstAgentId);
    expect(filtered.every((p) => p.agentId === firstAgentId)).toBe(true);
  });
});

describe('wallet transferOverallFrontierDollar mock', () => {
  it('resolves with a successful receipt', async () => {
    const services = createMockServices();
    const receipt = await services.wallet.transferOverallFrontierDollar(
      '0x1234567890123456789012345678901234567890',
      '0.05',
    );
    expect(receipt.success).toBe(true);
    expect(receipt.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('logs the transfer', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const services = createMockServices();
    await services.wallet.transferOverallFrontierDollar(
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      '1.00',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1.00 FND'),
    );
    consoleSpy.mockRestore();
  });
});
