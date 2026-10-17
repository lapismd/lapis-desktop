// SPDX-License-Identifier: Apache-2.0
// Retained chat composition; see ../NOTICE.md.
import { AiChatControllerState } from "./controller/state.svelte.ts";
import {
  restore,
  openConversation,
  _restoreConversation,
  _interruptUnresumableInteractions,
  _releaseUnreadableLocation,
} from "./controller/conversation-loading.ts";
import {
  newConversation,
  archiveCurrent,
  relocateScope,
  deleteCurrent,
  followDirectoryScope,
  setPinned,
  _clearOpenConversation,
  _ensureConversation,
} from "./controller/conversation-selection.ts";
import { submit } from "./controller/turn.ts";
import { _submitWithActivation } from "./controller/activation.ts";
import {
  respondToApproval,
  respondToQuestion,
  cancel,
  _confirmCancelledNotice,
  cancelAndSwitch,
  close,
} from "./controller/interactions.ts";
import { _consume, _consumeAppToolEvent } from "./controller/events.ts";
import { _executeSlash } from "./controller/command-dispatch.ts";
import {
  _applyAgentCommand,
  _applyScopeCommand,
  _describeScope,
  _describeContext,
  _sessionBootstrapMetadata,
} from "./controller/command-configuration.ts";
import {
  _withCommandProgress,
  _appendLocalNotice,
  _appendInventoryNotice,
  _recordCommandItem,
  _persistCommandNotice,
  _applySlashToolEvent,
  syncComposerCommands,
  _syncSlashCatalog,
} from "./controller/command-results.ts";
import {
  refreshSkills,
  _discoveryContext,
  _ensureLocalAppToolSession,
  _effectiveSkillSnapshot,
  _prepareSkillSnapshot,
} from "./controller/skills.ts";
import {
  _loadApprovalGrants,
  _rememberPersistentDecision,
} from "./controller/approval-state.ts";
import {
  _activateNewBinding,
  _prepareAppToolSession,
  _closeAppToolBinding,
  _detachSession,
  _bindingMatchesIdentity,
  _bindingMatchesConfiguration,
  _configureBinding,
} from "./controller/binding.ts";
import { _prepareSession } from "./controller/session.ts";
import {
  _appendDurableItems,
  _appendUsage,
  _persist,
} from "./controller/persistence.ts";
import { _tryResumeBinding } from "./controller/session-resume.ts";
export class AiChatController extends AiChatControllerState {
  restore = restore;
  openConversation = openConversation;
  _restoreConversation = _restoreConversation;
  _interruptUnresumableInteractions = _interruptUnresumableInteractions;
  _releaseUnreadableLocation = _releaseUnreadableLocation;
  newConversation = newConversation;
  archiveCurrent = archiveCurrent;
  relocateScope = relocateScope;
  deleteCurrent = deleteCurrent;
  followDirectoryScope = followDirectoryScope;
  setPinned = setPinned;
  _clearOpenConversation = _clearOpenConversation;
  _ensureConversation = _ensureConversation;
  submit = submit;
  _submitWithActivation = _submitWithActivation;
  respondToApproval = respondToApproval;
  respondToQuestion = respondToQuestion;
  cancel = cancel;
  _confirmCancelledNotice = _confirmCancelledNotice;
  cancelAndSwitch = cancelAndSwitch;
  close = close;
  _consume = _consume;
  _consumeAppToolEvent = _consumeAppToolEvent;
  _executeSlash = _executeSlash;
  _applyAgentCommand = _applyAgentCommand;
  _applyScopeCommand = _applyScopeCommand;
  _describeScope = _describeScope;
  _describeContext = _describeContext;
  _sessionBootstrapMetadata = _sessionBootstrapMetadata;
  _withCommandProgress = _withCommandProgress;
  _appendLocalNotice = _appendLocalNotice;
  _appendInventoryNotice = _appendInventoryNotice;
  _recordCommandItem = _recordCommandItem;
  _persistCommandNotice = _persistCommandNotice;
  _applySlashToolEvent = _applySlashToolEvent;
  syncComposerCommands = syncComposerCommands;
  _syncSlashCatalog = _syncSlashCatalog;
  refreshSkills = refreshSkills;
  _discoveryContext = _discoveryContext;
  _ensureLocalAppToolSession = _ensureLocalAppToolSession;
  _effectiveSkillSnapshot = _effectiveSkillSnapshot;
  _prepareSkillSnapshot = _prepareSkillSnapshot;
  _loadApprovalGrants = _loadApprovalGrants;
  _rememberPersistentDecision = _rememberPersistentDecision;
  _activateNewBinding = _activateNewBinding;
  _prepareAppToolSession = _prepareAppToolSession;
  _closeAppToolBinding = _closeAppToolBinding;
  _detachSession = _detachSession;
  _bindingMatchesIdentity = _bindingMatchesIdentity;
  _bindingMatchesConfiguration = _bindingMatchesConfiguration;
  _configureBinding = _configureBinding;
  _prepareSession = _prepareSession;
  _appendDurableItems = _appendDurableItems;
  _appendUsage = _appendUsage;
  _persist = _persist;
  _tryResumeBinding = _tryResumeBinding;

  constructor(...args: ConstructorParameters<typeof AiChatControllerState>) {
    super(...args);
    this._unsubscribeAppToolEvents = this._appToolBridge?.subscribe((event) => {
      void this._consumeAppToolEvent(event);
    });
  }
  get activeBindingId(): string | undefined {
    return this._activeBindingId;
  }
  _isAbandoned(turnId?: number): boolean {
    return turnId !== undefined && this._turnId !== turnId;
  }
}
