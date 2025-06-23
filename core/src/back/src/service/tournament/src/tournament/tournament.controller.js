const TournamentService = require('./tournament.service');

class TournamentController {
    async createGameResult(request, reply) {
        const { winnerId, loserId } = request.body;

        if (typeof winnerId !== 'number' || typeof loserId !== 'number') {
            return reply.code(400).send({ success: false, message: 'Invalid IDs' });
        }

        try {
            await TournamentService.createGameResult(winnerId, loserId);
            return reply.send({ success: true, message: 'Game result recorded successfully' });
        } catch (err) {
            request.log.error('[❌ DB] Failed to record game result:', err);
            return reply.code(500).send({ success: false, message: 'DB error' });
        }
    }

    async createMatchHistory(request, reply) {
        const { userId, opponent, result, scoreUser, scoreOpponent } = request.body;

        if (
            typeof userId !== 'number' ||
            typeof opponent !== 'string' ||
            !['win', 'loss'].includes(result) ||
            typeof scoreUser !== 'number' ||
            typeof scoreOpponent !== 'number'
        ) {
            return reply.code(400).send({ success: false, message: 'Invalid match history data' });
        }

        try {
            await TournamentService.createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent);
            return reply.send({ success: true });
        } catch (err) {
            request.log.error('[❌ DB] Failed to record match history:', err);
            return reply.code(500).send({ success: false, message: 'DB error' });
        }
    }

    async validateUsername(request, reply) {
        const username = (request.query.username || '').trim();

        if (!username || typeof username !== 'string') {
            return reply.code(400).send({ valid: false, message: 'Username is required' });
        }

        try {
            const result = await TournamentService.validateUsername(username);
            return reply.send(result);
        } catch (err) {
            request.log.error('[Validate Username Error]', err);
            return reply.code(500).send({ valid: false, message: 'Internal server error' });
        }
    }
}

module.exports = new TournamentController();