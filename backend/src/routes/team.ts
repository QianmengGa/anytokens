import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTeam, listTeams, getTeam,
  inviteMember, acceptInvite, removeMember, updateMemberLimits,
  createTeamKey, listTeamKeys, deleteTeamKey,
} from '../controllers/team.controller.js';

const teamRouter = Router();
teamRouter.use(authenticate as any);

// 团队 CRUD
teamRouter.post('/', createTeam as any);
teamRouter.get('/', listTeams as any);
teamRouter.get('/:teamId', getTeam as any);

// 成员管理
teamRouter.post('/:teamId/invite', inviteMember as any);
teamRouter.post('/accept-invite', acceptInvite as any);
teamRouter.delete('/:teamId/members/:userId', removeMember as any);
teamRouter.patch('/:teamId/members/:userId/limits', updateMemberLimits as any);

// 团队 API Key
teamRouter.post('/:teamId/keys', createTeamKey as any);
teamRouter.get('/:teamId/keys', listTeamKeys as any);
teamRouter.delete('/:teamId/keys/:keyId', deleteTeamKey as any);

export default teamRouter;
