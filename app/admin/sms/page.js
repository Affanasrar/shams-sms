'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SmsPage;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var sms_sender_1 = require("./sms-sender");
function SmsPage() {
    var _this = this;
    var _a = (0, react_1.useState)([]), contacts = _a[0], setContacts = _a[1];
    var _b = (0, react_1.useState)(null), activeChat = _b[0], setActiveChat = _b[1];
    var _c = (0, react_1.useState)([]), messages = _c[0], setMessages = _c[1];
    var _d = (0, react_1.useState)(''), reply = _d[0], setReply = _d[1];
    var _e = (0, react_1.useState)(false), sending = _e[0], setSending = _e[1];
    var _f = (0, react_1.useState)(true), loadingContacts = _f[0], setLoadingContacts = _f[1];
    var _g = (0, react_1.useState)(false), loadingMessages = _g[0], setLoadingMessages = _g[1];
    var _h = (0, react_1.useState)(null), globalError = _h[0], setGlobalError = _h[1];
    var _j = (0, react_1.useState)(null), sendError = _j[0], setSendError = _j[1];
    var _k = (0, react_1.useState)([]), smsLogs = _k[0], setSmsLogs = _k[1];
    var _l = (0, react_1.useState)(true), logsLoading = _l[0], setLogsLoading = _l[1];
    var _m = (0, react_1.useState)(null), logsError = _m[0], setLogsError = _m[1];
    var _o = (0, react_1.useState)([]), senderStudents = _o[0], setSenderStudents = _o[1];
    var _p = (0, react_1.useState)([]), courseSlots = _p[0], setCourseSlots = _p[1];
    var _q = (0, react_1.useState)(true), senderLoading = _q[0], setSenderLoading = _q[1];
    var _r = (0, react_1.useState)(null), senderError = _r[0], setSenderError = _r[1];
    var _s = (0, react_1.useState)('inbox'), view = _s[0], setView = _s[1];
    (0, react_1.useEffect)(function () {
        var loadInboxData = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, contactsRes, logsRes, senderRes, contactsData_1, logsData, senderData, error_1, message;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        setGlobalError(null);
                        setLoadingContacts(true);
                        setLogsLoading(true);
                        setSenderLoading(true);
                        setLogsError(null);
                        setSenderError(null);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        return [4 /*yield*/, Promise.all([
                                fetch('/api/admin/sms/inbox'),
                                fetch('/api/admin/sms/inbox?logs=true'),
                                fetch('/api/admin/sms/inbox?senderData=true')
                            ])];
                    case 2:
                        _a = _d.sent(), contactsRes = _a[0], logsRes = _a[1], senderRes = _a[2];
                        if (!contactsRes.ok) {
                            throw new Error('Failed to fetch conversations');
                        }
                        if (!logsRes.ok) {
                            throw new Error('Failed to fetch SMS logs');
                        }
                        if (!senderRes.ok) {
                            throw new Error('Failed to load sender data');
                        }
                        return [4 /*yield*/, contactsRes.json()];
                    case 3:
                        contactsData_1 = _d.sent();
                        return [4 /*yield*/, logsRes.json()];
                    case 4:
                        logsData = _d.sent();
                        return [4 /*yield*/, senderRes.json()];
                    case 5:
                        senderData = _d.sent();
                        setContacts(contactsData_1);
                        setSmsLogs(logsData);
                        setSenderStudents((_b = senderData.students) !== null && _b !== void 0 ? _b : []);
                        setCourseSlots((_c = senderData.courseSlots) !== null && _c !== void 0 ? _c : []);
                        setActiveChat(function (current) { var _a; return (_a = current !== null && current !== void 0 ? current : contactsData_1[0]) !== null && _a !== void 0 ? _a : null; });
                        return [3 /*break*/, 8];
                    case 6:
                        error_1 = _d.sent();
                        message = error_1 instanceof Error ? error_1.message : 'Unable to load SMS data.';
                        setGlobalError(message);
                        setLogsError(message);
                        setSenderError(message);
                        return [3 /*break*/, 8];
                    case 7:
                        setLoadingContacts(false);
                        setLogsLoading(false);
                        setSenderLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        loadInboxData();
    }, []);
    (0, react_1.useEffect)(function () {
        if (!(activeChat === null || activeChat === void 0 ? void 0 : activeChat.id)) {
            setMessages([]);
            return;
        }
        var controller = new AbortController();
        var isMounted = true;
        setLoadingMessages(true);
        setGlobalError(null);
        var fetchMessages = function () { return __awaiter(_this, void 0, void 0, function () {
            var params, res, messagesData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        params = new URLSearchParams({ studentId: activeChat.id });
                        return [4 /*yield*/, fetch("/api/admin/sms/inbox?".concat(params.toString()), {
                                signal: controller.signal
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error('Failed to fetch messages');
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        messagesData = _a.sent();
                        if (isMounted) {
                            setMessages(messagesData);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_2 = _a.sent();
                        if (error_2 instanceof Error && error_2.name === 'AbortError') {
                            return [2 /*return*/];
                        }
                        if (isMounted) {
                            setGlobalError('Failed to load messages.');
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        if (isMounted) {
                            setLoadingMessages(false);
                        }
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchMessages();
        return function () {
            isMounted = false;
            controller.abort();
        };
    }, [activeChat === null || activeChat === void 0 ? void 0 : activeChat.id]);
    var handleSendReply = function () { return __awaiter(_this, void 0, void 0, function () {
        var messageContent, tempMsg, response, payload, createdMessage_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!reply.trim() || !activeChat)
                        return [2 /*return*/];
                    messageContent = reply.trim();
                    setSending(true);
                    setSendError(null);
                    tempMsg = {
                        id: "temp-".concat(Date.now()),
                        message: messageContent,
                        direction: 'OUTBOUND',
                        status: 'PENDING',
                        createdAt: new Date().toISOString()
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [tempMsg], false); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch('/api/admin/sms/inbox', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId: activeChat.id, message: messageContent })
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return ({ error: 'Unknown error' }); })];
                case 3:
                    payload = _a.sent();
                    throw new Error(payload.error || "API error: ".concat(response.status));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    createdMessage_1 = _a.sent();
                    setMessages(function (prev) { return prev.map(function (msg) { return msg.id === tempMsg.id ? createdMessage_1 : msg; }); });
                    setReply('');
                    return [3 /*break*/, 8];
                case 6:
                    error_3 = _a.sent();
                    setMessages(function (prev) { return prev.filter(function (msg) { return msg.id !== tempMsg.id; }); });
                    setSendError(error_3 instanceof Error ? error_3.message : 'Unable to send message.');
                    return [3 /*break*/, 8];
                case 7:
                    setSending(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'DELIVERED':
                return <lucide_react_1.CheckCheck size={14} className="text-blue-500"/>;
            case 'SENT':
                return <lucide_react_1.Check size={14} className="text-gray-400"/>;
            case 'PENDING':
                return <lucide_react_1.Clock size={14} className="text-gray-400"/>;
            default:
                return null;
        }
    };
    return (<div className="space-y-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">SMS Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">One place for SMS inbox, sending, and logs</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage conversations, send one-off messages, and review recent SMS activity from a single admin dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={function () { return window.location.reload(); }} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            <lucide_react_1.RefreshCcw size={16}/>
            Refresh data
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <div className="hidden sm:flex items-center gap-2">
          <button type="button" onClick={function () { return setView('inbox'); }} className={"px-3 py-2 rounded-md text-sm font-medium ".concat(view === 'inbox' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200')}>
            Inbox
          </button>
          <button type="button" onClick={function () { return setView('logs'); }} className={"px-3 py-2 rounded-md text-sm font-medium ".concat(view === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200')}>
            Logs
          </button>
          <button type="button" onClick={function () { return setView('sender'); }} className={"px-3 py-2 rounded-md text-sm font-medium ".concat(view === 'sender' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200')}>
            Custom SMS
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {view === 'inbox' ? (<div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b px-5 py-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <p className="text-sm text-gray-500">Select a student and reply directly from the inbox.</p>
              </div>
              <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {contacts.length} contacts
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {loadingContacts ? (<div className="p-6 text-center text-gray-500">Loading conversations…</div>) : contacts.length === 0 ? (<div className="p-6 text-center text-gray-500">No conversations found yet.</div>) : (contacts.map(function (contact) {
                var _a, _b;
                return (<button key={contact.id} type="button" onClick={function () { return setActiveChat(contact); }} className={"group flex w-full flex-col gap-2 border-b px-5 py-4 text-left transition ".concat((activeChat === null || activeChat === void 0 ? void 0 : activeChat.id) === contact.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100')}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span className="text-xs text-gray-500">{contact.studentId}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{((_b = (_a = contact.smsMessages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) || 'No recent message'}</p>
                </button>);
            }))}
          </div>
        </section>

            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="border-b px-5 py-4 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
                <p className="text-sm text-gray-500">Reply to the selected student below.</p>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {activeChat ? activeChat.phone : 'No student selected'}
              </div>
            </div>
          </div>

          {activeChat ? (<>
              <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-white">
                {loadingMessages ? (<div className="flex h-full items-center justify-center text-gray-500">Loading messages…</div>) : messages.length === 0 ? (<div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                    <lucide_react_1.MessageSquare size={40}/>
                    <p>No messages yet. Send the first message to start the conversation.</p>
                  </div>) : (<div className="space-y-4">
                    {messages.map(function (msg) { return (<div key={msg.id} className={"flex ".concat(msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}>
                        <div className={"max-w-[80%] rounded-xl px-4 py-3 ".concat(msg.direction === 'OUTBOUND'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none text-gray-800')}>
                          <div className="whitespace-pre-wrap break-words text-sm">{msg.message}</div>
                          <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-gray-400">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.direction === 'OUTBOUND' && getStatusIcon(msg.status)}
                            {msg.status === 'FAILED' && (<span className="text-red-400" title={msg.errorMsg || 'Send failed'}>✕</span>)}
                          </div>
                        </div>
                      </div>); })}
                  </div>)}
              </div>

              {sendError && (<div className="border-t px-5 py-3 bg-red-50 text-sm text-red-700">{sendError}</div>)}

              <div className="border-t bg-white p-5">
                <div className="flex items-center gap-3">
                  <input type="text" value={reply} onChange={function (e) {
                    setReply(e.target.value);
                    setSendError(null);
                }} onKeyDown={function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                    }
                }} placeholder="Type a message and press Enter to send" disabled={sending} className="flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"/>
                  <button type="button" onClick={handleSendReply} disabled={sending || !reply.trim()} className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                    <lucide_react_1.Send size={16} className={sending ? 'animate-pulse' : ''}/>
                    <span className="ml-2">Send</span>
                  </button>
                </div>
              </div>
            </>) : (<div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-4 p-10 text-center text-gray-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <lucide_react_1.User size={28}/>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select a student to open the inbox</h3>
                <p className="mt-2 text-sm text-gray-500">The conversation thread will appear here once you choose a contact.</p>
              </div>
            </div>)}
        </section>
          </div>) : view === 'sender' ? (<div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b px-5 py-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Custom SMS Sender</h2>
                <p className="mt-1 text-sm text-gray-500">Send filtered custom SMS to students from one place.</p>
              </div>
              <div className="p-5">
                {senderLoading ? (<div className="text-sm text-gray-500">Loading sender tools…</div>) : senderError ? (<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{senderError}</div>) : (<sms_sender_1.SmsSender students={senderStudents} courseSlots={courseSlots}/>)}
              </div>
            </div>
          </div>) : (<div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b px-5 py-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Recent SMS Events</h2>
                <p className="mt-1 text-sm text-gray-500">Latest SMS sends and replies in the system.</p>
              </div>
              <div className="max-h-[calc(100vh-64px)] overflow-y-auto p-5">
                {logsLoading ? (<div className="text-sm text-gray-500">Loading SMS events…</div>) : logsError ? (<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{logsError}</div>) : smsLogs.length === 0 ? (<div className="text-sm text-gray-500">No SMS events found.</div>) : (<div className="space-y-4">
                    {smsLogs.map(function (log) { return (<div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{log.studentCode || 'Unknown student'}</p>
                            <p className="mt-1 text-sm text-gray-600">{log.studentName || 'No name available'}</p>
                          </div>
                          <span className={"rounded-full px-3 py-1 text-xs font-semibold ".concat(log.status === 'SENT' || log.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600')}>
                            {log.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">{log.message}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{log.direction}</span>
                        </div>
                      </div>); })}
                  </div>)}
              </div>
            </div>
          </div>)}
      </div>

      {globalError && (<div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {globalError}
        </div>)}
    </div>);
}
