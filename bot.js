// ============================================================
//  ALOOZ HOSTING — Secure Anti-Hack Bot v3.4
//  Copyright (c) ALOOZ HOSTING. All rights reserved.
//  Unauthorized modification disables this bot permanently.
//  Licensed to: ALOOZ
//  ALOOZ-HOSTING-SECURE-LOCK-SIGNATURE
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// First-run setup: no .env file or environment variables are used.
const readline = require('readline');
const CONFIG_FILE = path.join(__dirname, 'config.json');

async function showAnimatedBanner() {
  const title = 'ALOOZ HOSTING';
  const cyan = '\x1b[96m';
  const reset = '\x1b[0m';
  process.stdout.write('\n');
  for (let i = 1; i <= title.length; i++) {
    process.stdout.write(`\r${cyan}✦ ${title.slice(0, i)}${reset}`);
    await new Promise(resolve => setTimeout(resolve, 65));
  }
  process.stdout.write('\n\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  for (let i = 0; i < 18; i++) {
    process.stdout.write(`\r${cyan}${frames[i % frames.length]} Preparing secure first-run setup...${reset}`);
    await new Promise(resolve => setTimeout(resolve, 70));
  }
  process.stdout.write('\r' + ' '.repeat(58) + '\r');
}

async function loadRuntimeConfig() {
  await showAnimatedBanner();
  let saved = null;
  try { saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch {}

  if (!saved || !saved.token || !saved.guildId || !saved.ownerName) {
    console.log('\n🔐 ALOOZ HOSTING — FIRST RUN CONFIGURATION');
    console.log('Enter the required details below. They will be saved locally in config.json.');
    console.log('Do NOT upload config.json to GitHub or share your bot token.\n');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (question, fallback = '') => new Promise(resolve => {
      rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `, answer => resolve((answer || fallback).trim()));
    });
    let token = '';
    while (!token) token = await ask('Discord Bot Token');
    let ownerName = '';
    while (!ownerName) ownerName = await ask('Owner Name', 'ALOOZ');
    let guildId = '';
    while (!/^\d{17,20}$/.test(guildId)) {
      guildId = await ask('Discord Server ID (17–20 digits)');
      if (!/^\d{17,20}$/.test(guildId)) console.log('❌ Invalid Server ID. Copy the numeric ID from Discord Developer Mode.');
    }
    rl.close();
    saved = {
      token, ownerName, guildId,
      LOG_CHANNEL: '', VERIFY_CHANNEL: '', VERIFY_ROLE: '', UNVERIFIED_ROLE: '',
      TRUSTED_USERS: [], STAFF_ROLES: [],
      WHITELIST_GUILD_ID: guildId,
      ANTI_INVITE: true, ANTI_EVERYONE: true,
      ALLOWED_DOMAINS: ['youtube.com','github.com','discord.com','google.com','tenor.com','giphy.com'],
      ANNOUNCE_CHANNEL: '', WARN_THRESHOLD: 3, WARN_TIMEOUT: 3600000,
      WARN_DECAY: 2592000000, MIN_ACCOUNT_AGE: 604800000,
      ALT_TIMEOUT: 86400000, ADMIN_TIMEOUT_ENABLED: false,
      integrityHash: ''
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(saved, null, 2), { encoding: 'utf8', mode: 0o600 });
    console.log('\n✅ Setup saved. Restart the bot if your host requires it.\n');
  }
  return saved;
}

async function main() {
const APP_CONFIG = await loadRuntimeConfig();
const BRAND = 'ALOOZ HOSTING';
const OWNER = APP_CONFIG.ownerName || 'ALOOZ';
const SELF_FILE = __filename;
const DATA_DIR = path.join(__dirname, 'data');
const WARN_FILE = path.join(DATA_DIR, 'warnings.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// PERMANENT FIRST OWNER — fixed in source; setup cannot change this ID.
const HARDCODED_OWNER_IDS = ['1393482482917314681'];

const __BRAND_LOCK__ = {
  BRAND: 'ALOOZ HOSTING',
  SIGNATURE: 'ALOOZ-HOSTING-SECURE-LOCK-SIGNATURE',
  LICENSE: 'Licensed to: ALOOZ',
  HEADER: 'ALOOZ HOSTING — Secure Anti-Hack Bot',
  VERSION: '3.5.0',
};

function __ah_computeHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath, 'utf8')).digest('hex');
}
function __ah_showHash(hash) {
  console.log(`\n${'═'.repeat(62)}\n🔐 ${BRAND} — INTEGRITY HASH v${__BRAND_LOCK__.VERSION}\n${hash}\n${'═'.repeat(62)}\n`);
}
function __ah_brandLock() {
  const raw = fs.readFileSync(SELF_FILE, 'utf8');
  const required = [__BRAND_LOCK__.SIGNATURE, __BRAND_LOCK__.LICENSE, __BRAND_LOCK__.HEADER];
  if (required.some(value => !raw.includes(value))) {
    console.error(`[${BRAND}] ❌ Brand lock signature missing. Startup stopped.`);
    process.exit(1);
  }
  console.log(`[${BRAND}] 🔐 Brand lock: ${BRAND} © ${OWNER}`);
}
function __ah_verify() {
  const actual = __ah_computeHash(SELF_FILE);
  if (APP_CONFIG.integrityHash && APP_CONFIG.integrityHash !== actual) {
    console.error(`\n🔴 ${BRAND} — CODE INTEGRITY CHECK FAILED.\nThe bot file changed after setup. Re-run setup by backing up and removing config.json.\n`);
    process.exit(1);
  }
  if (!APP_CONFIG.integrityHash) {
    APP_CONFIG.integrityHash = actual;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(APP_CONFIG, null, 2), { encoding: 'utf8', mode: 0o600 });
  }
  __ah_showHash(actual);
  console.log(`[${BRAND}] ✅ Integrity verified.`);
}
function __ah_fileGuard() {
  const size = fs.statSync(SELF_FILE).size;
  if (size < 2000) { console.error(`[${BRAND}] ❌ File truncated (${size} bytes).`); process.exit(1); }
}
__ah_brandLock();
__ah_verify();
__ah_fileGuard();
console.log(`[${BRAND}] ✅ Integrity verified. All systems locked.`);

// ============================================================
//  IMPORTS
// ============================================================
const {
  Client, GatewayIntentBits, Partials, PermissionsBitField, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType,
  REST, Routes, SlashCommandBuilder, MessageFlags, AuditLogEvent,
} = require('discord.js');

// ============================================================
//  CONFIG
// ============================================================
const TRUSTED_USERS = Array.isArray(APP_CONFIG.TRUSTED_USERS) ? APP_CONFIG.TRUSTED_USERS.map(s => String(s).trim()).filter(Boolean) : [];
const ALLOWED_DOMAINS = Array.isArray(APP_CONFIG.ALLOWED_DOMAINS) ? APP_CONFIG.ALLOWED_DOMAINS.map(d => String(d).trim().toLowerCase()).filter(Boolean) : [];

const CONFIG = {
  TRUSTED_USERS,
  NUKE: { limit: 3, window: 10000, timeout: 3600000 },
  SPAM: { limit: 5, window: 5000, timeout: 600000 },
  DUPLICATE: { limit: 3, window: 10000, timeout: 600000 },
  PHISHING_TIMEOUT: 21600000,
  PHISHING_KEYWORDS: ['discord-nitro', 'free-nitro', 'steamgift', 'nitro-gift', 'giftnitro', 'dlscord', 'discordapp-gift', 'free-gift', 'nitro-drop', 'claim-nitro', 'steamcommunity.ru', 'free-robux', 'robux-generator', 'free-crypto'],
  BOT_ADD_TIMEOUT: 7200000,
  PERM: { limit: 2, window: 30000, timeout: 3600000 },
  WEBHOOK_TIMEOUT: 3600000,
  RAID: { joins: 5, window: 10000, lockdown: 600000 },
  MIN_ACCOUNT_AGE: (() => {
    const n = Number(APP_CONFIG.MIN_ACCOUNT_AGE);
    return Number.isFinite(n) && n >= 0 ? n : 7 * 24 * 60 * 60 * 1000;
  })(),
  ALT_TIMEOUT: (() => {
    const n = Number(APP_CONFIG.ALT_TIMEOUT);
    return Number.isFinite(n) && n > 0 ? n : 24 * 60 * 60 * 1000;
  })(),
  VERIFY_BUTTON_ID: 'alooz_verify_btn',
  VERIFY_CODE_LENGTH: 6,
  VERIFY_PENDING_TTL: 5 * 60 * 1000,
  VERIFY_RATE_LIMIT: { limit: 5, window: 60000 },
  ANNOUNCE_CHANNEL: APP_CONFIG.ANNOUNCE_CHANNEL || null,
  ADMIN_TIMEOUT_ENABLED: APP_CONFIG.ADMIN_TIMEOUT_ENABLED === true,
  WARN_THRESHOLD: (() => {
    const n = Number(APP_CONFIG.WARN_THRESHOLD);
    return Number.isFinite(n) && n >= 0 ? n : 3;
  })(),
  WARN_TIMEOUT: (() => {
    const n = Number(APP_CONFIG.WARN_TIMEOUT);
    return Number.isFinite(n) && n > 0 ? n : 3600000;
  })(),
  WARN_DECAY: (() => {
    const n = Number(APP_CONFIG.WARN_DECAY);
    return Number.isFinite(n) && n > 0 ? n : 30 * 24 * 60 * 60 * 1000;
  })(),
  STAFF_ROLES: (Array.isArray(APP_CONFIG.STAFF_ROLES) ? APP_CONFIG.STAFF_ROLES : []).map(r => String(r).trim()).filter(Boolean),
  SAVE_STATS_DEBOUNCE: 5000,
  CAPS_MIN_LENGTH: 10,
  CAPS_RATIO: 0.7,
  MENTION_SPAM: { limit: 3, window: 60000 },
};

// ============================================================
//  CLIENT
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ============================================================
//  🆕 COMMAND ACCESS CONTROL
//  Only the guild OWNER + hardcoded owner IDs can run commands.
//  Trusted users do NOT get command access (only auto-system bypass).
// ============================================================
function isCommandAuthorized(interactionOrMessage) {
  const userId = interactionOrMessage.user?.id || interactionOrMessage.author?.id;
  if (!userId) return false;
  if (HARDCODED_OWNER_IDS.includes(userId)) return true;

  const guild = interactionOrMessage.guild;
  if (guild && guild.ownerId === userId) return true;
  return false;
}

function denyAccess(interactionOrMessage, isInteraction) {
  const text = `🔒 **Access Denied** — Only the server owner${HARDCODED_OWNER_IDS.length ? ' or the bot owner' : ''} can use this command.`;
  try {
    if (isInteraction) {
      if (interactionOrMessage.replied || interactionOrMessage.deferred) {
        return interactionOrMessage.followUp({ content: text, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
      return interactionOrMessage.reply({ content: text, flags: MessageFlags.Ephemeral }).catch(() => {});
    } else {
      return interactionOrMessage.reply({ content: text }).catch(() => {});
    }
  } catch {}
}

// ============================================================
//  STATS + PERSISTENT STORE  (debounced writes)
// ============================================================
const STATS = {
  startTime: Date.now(), timeouts: 0, deleted: 0, botsBlocked: 0, phishing: 0,
  raidEvents: 0, warnings: 0, lockdowns: 0, staffPunished: 0,
  altAccountsTimedOut: 0, backups: 0, restores: 0, deniedCommands: 0,
};

let __statsDirty = false;
let __statsTimer = null;
function saveStats() {
  __statsDirty = true;
  if (__statsTimer) return;
  __statsTimer = setTimeout(() => {
    __statsTimer = null;
    if (!__statsDirty) return;
    __statsDirty = false;
    try { fs.writeFileSync(STATS_FILE, JSON.stringify(STATS, null, 2)); } catch {}
  }, CONFIG.SAVE_STATS_DEBOUNCE);
}
function flushStatsSync() {
  if (!__statsDirty) return;
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(STATS, null, 2)); __statsDirty = false; } catch {}
}

function loadWarnings() { try { return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8')); } catch { return {}; } }
function saveWarnings(w) { try { fs.writeFileSync(WARN_FILE, JSON.stringify(w, null, 2)); } catch {} }
let WARNINGS = loadWarnings();

// ============================================================
//  SLIDING WINDOW TRACKER
// ============================================================
const actionTracker = new Map();
function trackAction(key, limit, windowMs) {
  const now = Date.now();
  let arr = actionTracker.get(key) || [];
  arr = arr.filter(t => now - t < windowMs);
  arr.push(now);
  actionTracker.set(key, arr);
  return arr.length >= limit;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of actionTracker.entries()) {
    const fresh = arr.filter(t => now - t < 300000);
    if (fresh.length === 0) actionTracker.delete(k);
    else actionTracker.set(k, fresh);
  }
}, 60000);

// ============================================================
//  HELPERS
// ============================================================
async function getLogChannel(guild) {
  if (!guild || !APP_CONFIG.LOG_CHANNEL) return null;
  return guild.channels.cache.get(APP_CONFIG.LOG_CHANNEL)
      || await guild.channels.fetch(APP_CONFIG.LOG_CHANNEL).catch(() => null);
}

async function safeAuditFetch(guild, type, limit = 5) {
  for (let i = 0; i < 4; i++) {
    const logs = await guild.fetchAuditLogs({ type, limit }).catch(() => null);
    if (logs) return logs;
    await new Promise(r => setTimeout(r, 250 * (i + 1)));
  }
  return null;
}

// ============================================================
//  AUTO STAFF ROLE REMOVE & TIMEOUT
// ============================================================
async function punishUser(guild, userId, reason, duration) {
  if (!guild || !userId || userId === client.user.id || userId === guild.ownerId) return;
  if (CONFIG.TRUSTED_USERS.includes(userId)) return;
  if (HARDCODED_OWNER_IDS.includes(userId)) return;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const botHighest = guild.members.me.roles.highest.position;
  if (member.roles.highest.position >= botHighest) return;

  const logCh = await getLogChannel(guild);
  const removedRoles = [];

  const staffRolesToRemove = member.roles.cache.filter(role =>
    CONFIG.STAFF_ROLES.includes(role.id) || role.permissions.has(PermissionsBitField.Flags.Administrator)
  );

  if (staffRolesToRemove.size > 0) {
    for (const role of staffRolesToRemove.values()) {
      if (role.position < botHighest) {
        try {
          await member.roles.remove(role, `[${BRAND}] Danger detected`);
          removedRoles.push(role.name);
        } catch {}
      }
    }
    STATS.staffPunished++; saveStats();
  }

  if (duration > 0) {
    try {
      await member.timeout(duration, `[${BRAND}] ${reason}`);
      STATS.timeouts++; saveStats();
    } catch {}
  }

  if (logCh) {
    const embed = new EmbedBuilder()
      .setTitle(`🚨 ${BRAND} — DANGER ACTION DETECTED`)
      .setColor(0xFF0000)
      .setDescription(`**${member.user.tag}** violated security rules.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Timeout', value: duration > 0 ? `${Math.floor(duration/60000)}m` : 'None', inline: true },
        { name: 'Roles Removed', value: removedRoles.length ? removedRoles.join(', ') : 'None', inline: false }
      )
      .setTimestamp();
    logCh.send({ embeds: [embed] }).catch(() => {});
  }
}

// ============================================================
//  AUTO WARNING SYSTEM
// ============================================================
async function autoWarn(guild, userId, reason) {
  const gid = guild.id;
  if (!WARNINGS[gid]) WARNINGS[gid] = {};
  if (!WARNINGS[gid][userId]) WARNINGS[gid][userId] = [];

  WARNINGS[gid][userId].push({ reason, by: 'AUTO-BOT', at: Date.now() });
  saveWarnings(WARNINGS);
  STATS.warnings++; saveStats();

  const count = WARNINGS[gid][userId].length;
  const logCh = await getLogChannel(guild);

  if (count >= CONFIG.WARN_THRESHOLD) {
    await punishUser(guild, userId, `Auto-Timeout: Reached ${count} warnings`, CONFIG.WARN_TIMEOUT);
    if (logCh) logCh.send(`⛔ **Auto-Timeout:** <@${userId}> reached ${count} warnings. Reason: ${reason}`).catch(() => {});
  } else {
    if (logCh) logCh.send(`⚠️ **Auto-Warning:** <@${userId}> (${count}/${CONFIG.WARN_THRESHOLD}). Reason: ${reason}`).catch(() => {});
  }
}

// ============================================================
//  WARNING DECAY
// ============================================================
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const gid in WARNINGS) {
    for (const uid in WARNINGS[gid]) {
      const before = WARNINGS[gid][uid].length;
      WARNINGS[gid][uid] = WARNINGS[gid][uid].filter(w => now - w.at < CONFIG.WARN_DECAY);
      if (WARNINGS[gid][uid].length === 0) delete WARNINGS[gid][uid];
      if (WARNINGS[gid][uid] && WARNINGS[gid][uid].length !== before) changed = true;
    }
  }
  if (changed) saveWarnings(WARNINGS);
}, 60 * 60 * 1000);

// ============================================================
//  MESSAGE PROTECTION HELPERS
// ============================================================
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-z0-9]+/i;
const ZALGO_REGEX = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/;

function extractDomains(text) {
  const matches = text.match(URL_REGEX) || [];
  return matches.map(url => {
    try { return new URL(url.startsWith('http') ? url : 'http://' + url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
  }).filter(Boolean);
}
function isAllowedDomain(host) {
  if (ALLOWED_DOMAINS.length === 0) return true;
  return ALLOWED_DOMAINS.some(a => host === a || host.endsWith('.' + a));
}
function isCapsSpam(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < CONFIG.CAPS_MIN_LENGTH) return false;
  const caps = letters.replace(/[^A-Z]/g, '').length;
  return caps / letters.length > CONFIG.CAPS_RATIO;
}
function hasZalgo(text) { return ZALGO_REGEX.test(text); }

// ============================================================
//  MESSAGE HANDLER
// ============================================================
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const content = message.content.toLowerCase();
  const authorId = message.author.id;
  const guild = message.guild;
  const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);
  const canUseCommands = isCommandAuthorized(message);

  // ---- PREFIX COMMANDS (owner-only) ----
  if (message.content.startsWith('!announce ')) {
    if (!canUseCommands) {
      STATS.deniedCommands++; saveStats();
      return denyAccess(message, false);
    }
    const args = message.content.slice('!announce '.length).trim();
    let target = message.mentions.channels.first();
    let text = args;
    if (target) text = args.replace(/<#[0-9]+>\s*/, '').trim();
    else target = guild.channels.cache.get(CONFIG.ANNOUNCE_CHANNEL) || message.channel;
    if (!text) return message.reply('Usage: `!announce [#channel] message`');
    try {
      const msg = await target.send({ content: `@everyone\n\n${text}`, allowedMentions: { parse: ['everyone'] } });
      if (target.type === ChannelType.GuildAnnouncement) await msg.crosspost().catch(() => {});
      return message.reply(`✅ Sent to ${target}.`);
    } catch (e) { return message.reply(`❌ ${e.message}`); }
  }

  if (message.content === '!setupverify') {
    if (!canUseCommands) {
      STATS.deniedCommands++; saveStats();
      return denyAccess(message, false);
    }
    const ch = guild.channels.cache.get(APP_CONFIG.VERIFY_CHANNEL)
      || await guild.channels.fetch(APP_CONFIG.VERIFY_CHANNEL).catch(() => null);
    if (!ch) return message.reply('VERIFY_CHANNEL not set.');
    const embed = new EmbedBuilder().setTitle(`${BRAND} — Verification`).setDescription('Click **Verify** below.').setColor(0x5865F2).setFooter({ text: BRAND });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(CONFIG.VERIFY_BUTTON_ID).setLabel('Verify').setStyle(ButtonStyle.Success));
    await ch.send({ embeds: [embed], components: [row] });
    return message.reply('Verify panel created.');
  }

  // ---- AUTO SYSTEMS (always active, regardless of owner) ----

  if (CONFIG.PHISHING_KEYWORDS.some(k => content.includes(k))) {
    await message.delete().catch(() => {});
    STATS.phishing++; STATS.deleted++; saveStats();
    return punishUser(guild, authorId, 'Phishing link', CONFIG.PHISHING_TIMEOUT);
  }

  if (!isAdmin) {
    const domains = extractDomains(message.content);
    const bad = domains.filter(d => !isAllowedDomain(d));
    if (bad.length > 0) {
      await message.delete().catch(() => {});
      STATS.deleted++; saveStats();
      return autoWarn(guild, authorId, `Sent unallowed link: ${bad.join(',')}`);
    }
  }

  if (APP_CONFIG.ANTI_INVITE === true && !isAdmin && INVITE_REGEX.test(message.content)) {
    await message.delete().catch(() => {});
    return autoWarn(guild, authorId, 'Sent Discord invite');
  }

  if (APP_CONFIG.ANTI_EVERYONE === true && !isAdmin && (message.mentions.everyone || message.content.includes('@here'))) {
    await message.delete().catch(() => {});
    return punishUser(guild, authorId, 'Unauthorized @everyone', CONFIG.SPAM.timeout);
  }

  if (trackAction(`${authorId}_spam_${message.channel.id}`, CONFIG.SPAM.limit, CONFIG.SPAM.window)) {
    try {
      const recent = await message.channel.messages.fetch({ limit: CONFIG.SPAM.limit + 5 }).catch(() => null);
      if (recent) {
        const mine = recent.filter(m => m.author.id === authorId && Date.now() - m.createdTimestamp < CONFIG.SPAM.window);
        const deletable = mine.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
        if (deletable.size > 0) {
          await message.channel.bulkDelete(deletable, true).catch(() => {});
          STATS.deleted += deletable.size; saveStats();
        }
      }
    } catch {}
    return punishUser(guild, authorId, 'Spam', CONFIG.SPAM.timeout);
  }

  if (message.content.length > 5 && trackAction(`${authorId}_dup_${message.content.slice(0, 50)}`, CONFIG.DUPLICATE.limit, CONFIG.DUPLICATE.window)) {
    return autoWarn(guild, authorId, 'Duplicate messages');
  }

  if (message.mentions.users.size >= 5) {
    await message.delete().catch(() => {});
    return autoWarn(guild, authorId, 'Mass mention');
  }

  if (!isAdmin && message.mentions.users.size >= 1) {
    const targets = message.mentions.users.filter(u => u.id !== authorId);
    for (const u of targets.values()) {
      if (trackAction(`mention_${authorId}_${u.id}`, CONFIG.MENTION_SPAM.limit, CONFIG.MENTION_SPAM.window)) {
        await message.delete().catch(() => {});
        return autoWarn(guild, authorId, `Mention spam on ${u.tag}`);
      }
    }
  }

  if (!isAdmin && isCapsSpam(message.content)) {
    await message.delete().catch(() => {});
    return autoWarn(guild, authorId, 'Excessive caps');
  }

  if (hasZalgo(message.content)) {
    await message.delete().catch(() => {});
    return autoWarn(guild, authorId, 'Zalgo / glitch text');
  }
});

// ============================================================
//  ANTI-DELETE / ANTI-EDIT LOGGING
// ============================================================
client.on('messageDelete', async (msg) => {
  if (!msg.guild) return;
  if (msg.author?.bot) return;
  if (msg.system) return;

  const logCh = await getLogChannel(msg.guild);
  if (!logCh) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .setColor(0xED4245)
    .addFields(
      { name: 'Author', value: msg.author ? `${msg.author.tag} (${msg.author.id})` : 'Unknown', inline: true },
      { name: 'Channel', value: `<#${msg.channel.id}>`, inline: true },
      { name: 'Content', value: msg.content?.slice(0, 1000) || '(no text content)' }
    )
    .setTimestamp();
  logCh.send({ embeds: [embed] }).catch(() => {});
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (!newMsg.guild) return;
  if (newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;

  const logCh = await getLogChannel(newMsg.guild);
  if (!logCh) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Message Edited')
    .setColor(0xFEE75C)
    .addFields(
      { name: 'Author', value: `${newMsg.author.tag} (${newMsg.author.id})`, inline: true },
      { name: 'Channel', value: `<#${newMsg.channel.id}>`, inline: true },
      { name: 'Before', value: oldMsg.content?.slice(0, 500) || '(empty)' },
      { name: 'After', value: newMsg.content?.slice(0, 500) || '(empty)' }
    )
    .setTimestamp();
  logCh.send({ embeds: [embed] }).catch(() => {});
});

// ============================================================
//  AUDIT LOG PROTECTION
// ============================================================
const NUKE_ACTIONS = ['CHANNEL_DELETE', 'ROLE_DELETE', 'MEMBER_BAN_ADD', 'MEMBER_KICK'];

const SPAM_ACTIONS = {
  CHANNEL_CREATE: '_chcreate',
  CHANNEL_UPDATE: '_chupdate',
  ROLE_CREATE: '_rolecreate',
  ROLE_UPDATE: '_roleupdate',
  EMOJI_DELETE: '_emoji',
  STICKER_DELETE: '_emoji',
};

client.on('guildAuditLogEntryCreate', async (entry, guild) => {
  const executorId = entry.executorId;
  if (!executorId || executorId === client.user.id) return;
  if (CONFIG.TRUSTED_USERS.includes(executorId)) return;
  if (HARDCODED_OWNER_IDS.includes(executorId)) return;
  if (guild.ownerId === executorId) return;

  if (NUKE_ACTIONS.includes(entry.action)) {
    if (trackAction(executorId + '_nuke', CONFIG.NUKE.limit, CONFIG.NUKE.window)) {
      await punishUser(guild, executorId, 'Mass destructive action (Anti-Nuke)', CONFIG.NUKE.timeout);
    }
  }

  const key = SPAM_ACTIONS[entry.action];
  if (key && trackAction(executorId + key, 3, 10000)) {
    await punishUser(guild, executorId, `Spam: ${entry.action}`, CONFIG.NUKE.timeout);
  }
});

// ============================================================
//  ANTI-BOT — kicks bot only, times out adder (never kicks members)
// ============================================================
client.on('guildAuditLogEntryCreate', async (entry, guild) => {
  if (entry.action !== AuditLogEvent.BotAdd) return;
  const executorId = entry.executorId;
  if (!executorId || executorId === client.user.id) return;
  if (CONFIG.TRUSTED_USERS.includes(executorId)) return;
  if (HARDCODED_OWNER_IDS.includes(executorId)) return;
  if (guild.ownerId === executorId) return;

  STATS.botsBlocked++; saveStats();

  const botMember = await guild.members.fetch(entry.targetId).catch(() => null);
  if (botMember?.user.bot) {
    await botMember.kick(`[${BRAND}] Unauthorized bot`).catch(() => {});
  }
  await punishUser(guild, executorId, `Unauthorized bot added${botMember ? `: ${botMember.user.tag}` : ''}`, CONFIG.BOT_ADD_TIMEOUT);
});

// ============================================================
//  ANTI-PERMISSION
// ============================================================
const DANGEROUS_PERMS = [
  PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ManageWebhooks,
];

client.on('guildMemberUpdate', async (oldM, newM) => {
  const added = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id));
  if (added.size === 0) return;
  for (const role of added.values()) {
    if (!role.permissions.any(DANGEROUS_PERMS)) continue;
    const logs = await safeAuditFetch(newM.guild, AuditLogEvent.MemberRoleUpdate, 5);
    const executor = logs?.entries.find(e =>
      e.targetId === newM.id && CONFIG.TRUSTED_USERS.indexOf(e.executorId) === -1 && e.executorId !== client.user.id
    )?.executor;
    if (!executor || executor.id === client.user.id || CONFIG.TRUSTED_USERS.includes(executor.id)) continue;
    if (HARDCODED_OWNER_IDS.includes(executor.id)) continue;
    if (newM.guild.ownerId === executor.id) continue;

    if (trackAction(executor.id + '_perm', CONFIG.PERM.limit, CONFIG.PERM.window)) {
      await punishUser(newM.guild, executor.id, 'Permission escalation', CONFIG.PERM.timeout);
    }
  }
});

// ============================================================
//  ANTI-WEBHOOK
// ============================================================
client.on('guildAuditLogEntryCreate', async (entry, guild) => {
  if (entry.action !== AuditLogEvent.WebhookCreate) return;
  const executorId = entry.executorId;
  if (!executorId || executorId === client.user.id) return;
  if (CONFIG.TRUSTED_USERS.includes(executorId)) return;
  if (HARDCODED_OWNER_IDS.includes(executorId)) return;
  if (guild.ownerId === executorId) return;

  const hooks = await guild.fetchWebhooks().catch(() => null);
  const wh = hooks?.get(entry.targetId);
  if (wh && wh.owner && wh.owner.id !== client.user.id && !CONFIG.TRUSTED_USERS.includes(wh.owner.id)) {
    await wh.delete('Unauthorized').catch(() => {});
    await punishUser(guild, executorId, `Unauthorized webhook created: ${wh.name}`, CONFIG.WEBHOOK_TIMEOUT);
  }
});

// ============================================================
//  ANTI-RAID + ALT-ACCOUNT DETECTION (timeout only)
// ============================================================
const raidLockdownState = new Map();
const manualRaidMode = new Set();

async function startLockdown(guild, logCh, manual = false) {
  if (raidLockdownState.has(guild.id)) return;
  const state = new Map();
  for (const ch of guild.channels.cache.values()) {
    if (!ch.isTextBased() || !ch.manageable) continue;
    const ow = ch.permissionOverwrites.cache.get(guild.roles.everyone.id);
    state.set(ch.id, {
      hadOverwrite: !!ow,
      allow: ow ? ow.allow.bitfield.toString() : '0',
      deny: ow ? ow.deny.bitfield.toString() : '0',
    });
    await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
  }
  raidLockdownState.set(guild.id, state);
  if (manual) manualRaidMode.add(guild.id);
  if (logCh) logCh.send(`🚨 **RAID MODE ${manual ? '(MANUAL)' : '(AUTO)'} ACTIVE** — ${manual ? 'Manual until /raidmode off' : `Lockdown ${CONFIG.RAID.lockdown / 60000}min`}.`).catch(() => {});

  if (!manual) {
    setTimeout(async () => {
      if (manualRaidMode.has(guild.id)) return;
      await endLockdown(guild, logCh);
    }, CONFIG.RAID.lockdown);
  }
}

async function endLockdown(guild, logCh) {
  const saved = raidLockdownState.get(guild.id);
  if (!saved) return 0;
  raidLockdownState.delete(guild.id);
  manualRaidMode.delete(guild.id);
  let n = 0;
  for (const [chId, prev] of saved.entries()) {
    const ch = guild.channels.cache.get(chId);
    if (!ch || !ch.manageable) continue;
    try {
      if (!prev.hadOverwrite) {
        await ch.permissionOverwrites.delete(guild.roles.everyone).catch(() => {});
      } else {
        await ch.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: (BigInt(prev.allow) & PermissionsBitField.Flags.SendMessages) ? true
                     : (BigInt(prev.deny) & PermissionsBitField.Flags.SendMessages) ? false : null,
        }).catch(() => {});
      }
      n++;
    } catch {}
  }
  if (logCh) logCh.send(`✅ **Raid mode OFF** — Restored ${n} channels.`).catch(() => {});
  return n;
}

client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;

  if (member.user.bot) return;

  // ALT-ACCOUNT DETECTION — TIMEOUT ONLY (no kick)
  if (CONFIG.MIN_ACCOUNT_AGE > 0) {
    const age = Date.now() - member.user.createdTimestamp;
    if (age < CONFIG.MIN_ACCOUNT_AGE) {
      const days = Math.floor(age / 86400000);
      try {
        await member.timeout(CONFIG.ALT_TIMEOUT, `[${BRAND}] Account too new (${days}d old, min ${Math.floor(CONFIG.MIN_ACCOUNT_AGE/86400000)}d)`);
        STATS.altAccountsTimedOut++; saveStats();
        const logCh = await getLogChannel(guild);
        if (logCh) logCh.send(`⏱️ **Alt-Account Timed Out:** ${member.user.tag} — account created ${days}d ago (min ${Math.floor(CONFIG.MIN_ACCOUNT_AGE/86400000)}d). Timeout: ${Math.floor(CONFIG.ALT_TIMEOUT/60000)}m.`).catch(() => {});
      } catch {}
    }
  }

  const uRole = guild.roles.cache.get(APP_CONFIG.UNVERIFIED_ROLE);
  if (uRole) await member.roles.add(uRole).catch(() => {});

  if (trackAction('raid_' + guild.id, CONFIG.RAID.joins, CONFIG.RAID.window)) {
    STATS.raidEvents++; STATS.lockdowns++; saveStats();
    const logCh = await getLogChannel(guild);
    await startLockdown(guild, logCh, false);
  }
});

// ============================================================
//  WHITELIST GUILD LOCK
// ============================================================
client.on('guildCreate', async (guild) => {
  const wl = APP_CONFIG.WHITELIST_GUILD_ID;
  if (!wl || guild.id === wl) return;
  await guild.leave().catch(() => {});
});

// ============================================================
//  VERIFICATION SYSTEM
// ============================================================
const pendingVerifications = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [uid, v] of pendingVerifications.entries()) {
    if (v.expiresAt < now) pendingVerifications.delete(uid);
  }
}, 60000);

// ============================================================
//  BACKUP / RESTORE HELPERS
// ============================================================
function backupPath(guildId) { return path.join(BACKUP_DIR, `backup-${guildId}.json`); }

async function createBackup(guild) {
  const channels = [];
  for (const ch of guild.channels.cache.values()) {
    channels.push({
      id: ch.id, name: ch.name, type: ch.type, parentId: ch.parentId, position: ch.position,
      topic: ch.topic || null, nsfw: ch.nsfw || false, bitrate: ch.bitrate || null, userLimit: ch.userLimit || null,
      permissionOverwrites: ch.permissionOverwrites.cache.map(ow => ({
        id: ow.id, type: ow.type, allow: ow.allow.bitfield.toString(), deny: ow.deny.bitfield.toString(),
      })),
    });
  }
  const roles = guild.roles.cache.filter(r => !r.managed && r.id !== guild.id).map(r => ({
    id: r.id, name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable,
    position: r.position, permissions: r.permissions.bitfield.toString(), icon: r.iconURL() || null,
  }));
  const emojis = guild.emojis.cache.map(e => ({ name: e.name, url: e.imageURL(), animated: e.animated }));

  const data = { guildId: guild.id, guildName: guild.name, createdAt: Date.now(), channels, roles, emojis };
  fs.writeFileSync(backupPath(guild.id), JSON.stringify(data, null, 2), 'utf8');
  STATS.backups++; saveStats();
  return data;
}

async function restoreBackup(guild) {
  const p = backupPath(guild.id);
  if (!fs.existsSync(p)) throw new Error('No backup found for this guild.');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));

  let rolesCreated = 0, channelsCreated = 0, emojisCreated = 0;

  const roleIdMap = new Map();
  const sortedRoles = [...data.roles].sort((a, b) => a.position - b.position);
  for (const r of sortedRoles) {
    let role = guild.roles.cache.find(x => x.name === r.name && !x.managed);
    if (!role) {
      try {
        role = await guild.roles.create({
          name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable,
          permissions: BigInt(r.permissions),
          reason: `[${BRAND}] Restore backup`,
        });
        rolesCreated++;
      } catch {}
    }
    if (role) roleIdMap.set(r.id, role.id);
  }

  const cats = data.channels.filter(c => c.type === ChannelType.GuildCategory);
  const nonCats = data.channels.filter(c => c.type !== ChannelType.GuildCategory);
  const chIdMap = new Map();

  for (const c of [...cats, ...nonCats]) {
    let existing = guild.channels.cache.find(x => x.name === c.name && x.type === c.type);
    if (existing) { chIdMap.set(c.id, existing.id); continue; }
    try {
      const parent = c.parentId ? (chIdMap.get(c.parentId) || c.parentId) : undefined;
      const overwrites = (c.permissionOverwrites || []).map(ow => ({
        id: roleIdMap.get(ow.id) || ow.id,
        type: ow.type,
        allow: BigInt(ow.allow),
        deny: BigInt(ow.deny),
      })).filter(ow => guild.roles.cache.has(ow.id) || guild.members.cache.has(ow.id));

      const created = await guild.channels.create({
        name: c.name, type: c.type, parent, position: c.position,
        topic: c.topic || undefined, nsfw: c.nsfw || false,
        permissionOverwrites: overwrites,
        reason: `[${BRAND}] Restore backup`,
      });
      chIdMap.set(c.id, created.id);
      channelsCreated++;
    } catch {}
  }

  for (const e of data.emojis) {
    if (!guild.emojis.cache.find(x => x.name === e.name)) {
      try { await guild.emojis.create({ attachment: e.url, name: e.name, reason: `[${BRAND}] Restore backup` }); emojisCreated++; } catch {}
    }
  }

  STATS.restores++; saveStats();
  return { rolesCreated, channelsCreated, emojisCreated };
}

// ============================================================
//  SLASH COMMANDS
// ============================================================
const slashCommands = [
  new SlashCommandBuilder().setName('announce').setDescription('Send an announcement')
    .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addBooleanOption(o => o.setName('ping').setDescription('Ping @everyone?')),

  new SlashCommandBuilder().setName('verify-setup').setDescription('Create the verification panel'),

  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  new SlashCommandBuilder().setName('untimeout').setDescription('Remove timeout')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('warn').setDescription('Warn a member')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),

  new SlashCommandBuilder().setName('warnings').setDescription('Show warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('clear').setDescription('Bulk delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),

  new SlashCommandBuilder().setName('lockdown').setDescription('Lock all text channels'),
  new SlashCommandBuilder().setName('unlock').setDescription('Unlock all text channels'),

  new SlashCommandBuilder().setName('raidmode').setDescription('Toggle manual raid mode')
    .addStringOption(o => o.setName('state').setDescription('on or off').setRequired(true)
      .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })),

  new SlashCommandBuilder().setName('backup').setDescription('Create a backup of channels/roles/emojis'),
  new SlashCommandBuilder().setName('restore').setDescription('Restore from the latest backup'),

  new SlashCommandBuilder().setName('userinfo').setDescription('Show info about a user')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
  new SlashCommandBuilder().setName('security-status').setDescription('Show all security system statuses'),
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('help').setDescription('Show all commands'),
];

// ============================================================
//  REGISTER SLASH
// ============================================================
async function registerSlash() {
  const rest = new REST({ version: '10' }).setToken(APP_CONFIG.token);
  const body = slashCommands.map(c => c.toJSON());
  try {
    if (APP_CONFIG.guildId) {
      await rest.put(Routes.applicationGuildCommands(client.user.id, APP_CONFIG.guildId), { body });
      console.log(`[${BRAND}] ✅ Slash commands registered (guild)`);
    } else {
      await rest.put(Routes.applicationCommands(client.user.id), { body });
      console.log(`[${BRAND}] ✅ Global slash commands registered`);
    }
  } catch (err) {
    console.error(`[${BRAND}] ❌ Slash registration failed:`, err.message);
  }
}

// ============================================================
//  INTERACTION HANDLER
// ============================================================
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === CONFIG.VERIFY_BUTTON_ID) {
      if (trackAction('vbtn_' + interaction.user.id, CONFIG.VERIFY_RATE_LIMIT.limit, CONFIG.VERIFY_RATE_LIMIT.window)) {
        return interaction.reply({ content: '⏳ Too many attempts. Please wait a minute.', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
      const code = Math.random().toString(36).substring(2, 2 + CONFIG.VERIFY_CODE_LENGTH).toUpperCase();
      pendingVerifications.set(interaction.user.id, { code, expiresAt: Date.now() + CONFIG.VERIFY_PENDING_TTL });
      const modal = new ModalBuilder().setCustomId('alooz_verify_modal').setTitle(`${BRAND} Verification`);
      const input = new TextInputBuilder().setCustomId('verify_input').setLabel(`Enter code: ${code}`).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'alooz_verify_modal') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const input = interaction.fields.getTextInputValue('verify_input').toUpperCase();
      const entry = pendingVerifications.get(interaction.user.id);

      if (!entry || entry.expiresAt < Date.now() || input !== entry.code) {
        if (entry && entry.expiresAt < Date.now()) pendingVerifications.delete(interaction.user.id);
        return interaction.editReply({ content: '❌ Wrong or expired code!' });
      }

      pendingVerifications.delete(interaction.user.id);
      const vRole = interaction.guild.roles.cache.get(APP_CONFIG.VERIFY_ROLE);
      const uRole = interaction.guild.roles.cache.get(APP_CONFIG.UNVERIFIED_ROLE);

      try {
        if (vRole) await interaction.member.roles.add(vRole);
        if (uRole) await interaction.member.roles.remove(uRole).catch(() => {});
        await interaction.editReply({ content: `✅ Verified! Welcome to ${BRAND}.` });
        const logCh = await getLogChannel(interaction.guild);
        if (logCh) logCh.send(`${interaction.user.tag} verified.`).catch(() => {});
      } catch (err) {
        await interaction.editReply({ content: '❌ Failed to assign roles. Check bot permissions.' });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    // 🆕 OWNER-ONLY GATE
    if (!isCommandAuthorized(interaction)) {
      STATS.deniedCommands++; saveStats();
      return denyAccess(interaction, true);
    }

    const cmd = interaction.commandName;

    if (cmd === 'ping') {
      const uptime = Math.floor((Date.now() - STATS.startTime) / 1000);
      return interaction.reply({ content: `🏓 **${client.ws.ping}ms** | Uptime: ${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`, flags: MessageFlags.Ephemeral });
    }

    if (cmd === 'help') {
      const embed = new EmbedBuilder()
        .setTitle(`📖 ${BRAND} v${__BRAND_LOCK__.VERSION} — Commands`)
        .setColor(0x5865F2)
        .setDescription('🔒 **All commands are restricted to the Server Owner + Bot Owner.**')
        .addFields(
          { name: '🛡️ Moderation', value: '`/timeout` `/untimeout` `/warn` `/warnings` `/clear`' },
          { name: '🔒 Security', value: '`/lockdown` `/unlock` `/raidmode` `/security-status`' },
          { name: '💾 Backup', value: '`/backup` `/restore`' },
          { name: '📢 Utility', value: '`/announce` `/verify-setup` `/userinfo` `/serverinfo` `/ping` `/help`' },
        )
        .setFooter({ text: `${BRAND} © ${OWNER}` });
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (cmd === 'security-status') {
      const uptime = Math.floor((Date.now() - STATS.startTime) / 1000);
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${BRAND} v${__BRAND_LOCK__.VERSION} — Security Status`)
        .setColor(0x00FF00)
        .addFields(
          { name: '🔐 Brand Lock', value: '✅', inline: true },
          { name: '🔐 Integrity', value: '✅', inline: true },
          { name: '⏱️ Uptime', value: `${Math.floor(uptime/3600)}h`, inline: true },
          { name: '🔑 Command Gate', value: 'Owner-Only ✅', inline: true },
          { name: '🛡️ Anti-Nuke', value: '✅', inline: true },
          { name: '🛡️ Anti-Phishing', value: '✅', inline: true },
          { name: '🛡️ Anti-Bot', value: '✅', inline: true },
          { name: '🛡️ Alt-Account Guard', value: '✅', inline: true },
          { name: '🛡️ Anti-Caps/Zalgo', value: '✅', inline: true },
          { name: '🛡️ Anti-Mention Spam', value: '✅', inline: true },
          { name: '📊 Timeouts', value: `${STATS.timeouts}`, inline: true },
          { name: '📊 Alt Timed Out', value: `${STATS.altAccountsTimedOut}`, inline: true },
          { name: '📊 Warnings', value: `${STATS.warnings}`, inline: true },
          { name: '📊 Backups', value: `${STATS.backups}`, inline: true },
          { name: '📊 Restores', value: `${STATS.restores}`, inline: true },
          { name: '📊 Denied Cmds', value: `${STATS.deniedCommands}`, inline: true },
        )
        .setFooter({ text: BRAND })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (cmd === 'announce') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const text = interaction.options.getString('message');
      const ping = interaction.options.getBoolean('ping') ?? true;
      const target = interaction.options.getChannel('channel') || interaction.guild.channels.cache.get(CONFIG.ANNOUNCE_CHANNEL) || interaction.channel;
      try {
        const msg = await target.send({ content: ping ? `@everyone\n\n${text}` : text, allowedMentions: ping ? { parse: ['everyone'] } : { parse: [] } });
        if (target.type === ChannelType.GuildAnnouncement) await msg.crosspost().catch(() => {});
        return interaction.editReply({ content: `✅ Sent to ${target}.` });
      } catch (e) { return interaction.editReply({ content: `❌ ${e.message}` }); }
    }

    if (cmd === 'verify-setup') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const ch = interaction.guild.channels.cache.get(APP_CONFIG.VERIFY_CHANNEL)
        || await interaction.guild.channels.fetch(APP_CONFIG.VERIFY_CHANNEL).catch(() => null);
      if (!ch) return interaction.editReply({ content: '❌ VERIFY_CHANNEL not set.' });
      const embed = new EmbedBuilder().setTitle(`${BRAND} — Verification`).setDescription('Click **Verify** below.').setColor(0x5865F2).setFooter({ text: BRAND });
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(CONFIG.VERIFY_BUTTON_ID).setLabel('Verify').setStyle(ButtonStyle.Success));
      await ch.send({ embeds: [embed], components: [row] });
      return interaction.editReply({ content: '✅ Panel created.' });
    }

    if (cmd === 'timeout') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const user = interaction.options.getUser('user');
      const mins = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') || 'Manual';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ content: '❌ Member not found.' });
      try {
        await member.timeout(mins * 60000, `[${BRAND}] ${reason}`);
        STATS.timeouts++; saveStats();
        return interaction.editReply({ content: `✅ ${user.tag} timed out ${mins}m.` });
      } catch (e) { return interaction.editReply({ content: `❌ ${e.message}` }); }
    }

    if (cmd === 'untimeout') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ content: '❌ Not found.' });
      try {
        await member.timeout(null);
        return interaction.editReply({ content: `✅ Removed from ${user.tag}.` });
      } catch (e) { return interaction.editReply({ content: `❌ ${e.message}` }); }
    }

    if (cmd === 'warn') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const gid = interaction.guild.id;
      if (!WARNINGS[gid]) WARNINGS[gid] = {};
      if (!WARNINGS[gid][user.id]) WARNINGS[gid][user.id] = [];
      WARNINGS[gid][user.id].push({ reason, by: interaction.user.id, at: Date.now() });
      saveWarnings(WARNINGS);
      STATS.warnings++; saveStats();
      const count = WARNINGS[gid][user.id].length;
      let extra = '';
      if (count >= CONFIG.WARN_THRESHOLD) {
        await punishUser(interaction.guild, user.id, `${count} warnings reached`, CONFIG.WARN_TIMEOUT);
        extra = `\n⚠️ Threshold reached (${count}) → auto-timeout.`;
      }
      return interaction.editReply({ content: `✅ Warned ${user.tag} (${count} total).${extra}` });
    }

    if (cmd === 'warnings') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const user = interaction.options.getUser('user');
      const gid = interaction.guild.id;
      const list = WARNINGS[gid]?.[user.id] || [];
      if (list.length === 0) return interaction.editReply({ content: `${user.tag} has no warnings.` });
      const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warnings for ${user.tag}`)
        .setColor(0xFFAA00)
        .setDescription(list.map((w, i) => `**${i+1}.** ${w.reason} — <@${w.by}> (<t:${Math.floor(w.at/1000)}:R>)`).join('\n'))
        .setFooter({ text: BRAND });
      return interaction.editReply({ embeds: [embed] });
    }

    if (cmd === 'clear') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const amount = interaction.options.getInteger('amount');
      try {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        STATS.deleted += deleted.size; saveStats();
        return interaction.editReply({ content: `✅ Deleted ${deleted.size} messages.` });
      } catch (e) { return interaction.editReply({ content: `❌ ${e.message}` }); }
    }

    if (cmd === 'lockdown') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const logCh = await getLogChannel(interaction.guild);
      const before = raidLockdownState.has(interaction.guild.id);
      await startLockdown(interaction.guild, logCh, false);
      return interaction.editReply({ content: before ? '🔒 Lockdown already active.' : '🔒 Lockdown started.' });
    }

    if (cmd === 'unlock') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const logCh = await getLogChannel(interaction.guild);
      const n = await endLockdown(interaction.guild, logCh);
      return interaction.editReply({ content: n > 0 ? `🔓 Restored ${n} channels.` : 'ℹ️ No active lockdown.' });
    }

    if (cmd === 'raidmode') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const state = interaction.options.getString('state');
      const logCh = await getLogChannel(interaction.guild);
      if (state === 'on') {
        if (raidLockdownState.has(interaction.guild.id)) {
          return interaction.editReply({ content: '🔒 Raid mode already active.' });
        }
        await startLockdown(interaction.guild, logCh, true);
        return interaction.editReply({ content: '🚨 Raid mode **ON** (manual). Use `/raidmode off` to lift.' });
      } else {
        const n = await endLockdown(interaction.guild, logCh);
        return interaction.editReply({ content: n > 0 ? `🔓 Raid mode **OFF** — restored ${n} channels.` : 'ℹ️ Raid mode was not active.' });
      }
    }

    if (cmd === 'backup') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const data = await createBackup(interaction.guild);
        return interaction.editReply({ content: `💾 Backup created: **${data.channels.length}** channels, **${data.roles.length}** roles, **${data.emojis.length}** emojis.` });
      } catch (e) {
        return interaction.editReply({ content: `❌ Backup failed: ${e.message}` });
      }
    }

    if (cmd === 'restore') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const r = await restoreBackup(interaction.guild);
        return interaction.editReply({ content: `♻️ Restore complete — roles: **${r.rolesCreated}**, channels: **${r.channelsCreated}**, emojis: **${r.emojisCreated}**.` });
      } catch (e) {
        return interaction.editReply({ content: `❌ Restore failed: ${e.message}` });
      }
    }

    if (cmd === 'userinfo') {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const embed = new EmbedBuilder().setTitle(`👤 ${user.tag}`).setColor(0x5865F2).setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: 'ID', value: user.id, inline: true }, { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true })
        .setFooter({ text: BRAND });
      if (member) {
        embed.addFields(
          { name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true },
          { name: 'Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.name).join(', ') || 'None' },
        );
      }
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (cmd === 'serverinfo') {
      const g = interaction.guild;
      const embed = new EmbedBuilder().setTitle(`🏰 ${g.name}`).setColor(0x5865F2).setThumbnail(g.iconURL({ dynamic: true }))
        .addFields(
          { name: 'ID', value: g.id, inline: true }, { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline: true },
          { name: 'Members', value: `${g.memberCount}`, inline: true }, { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
          { name: 'Roles', value: `${g.roles.cache.size}`, inline: true }, { name: 'Boosts', value: `${g.premiumSubscriptionCount || 0}`, inline: true },
        ).setFooter({ text: BRAND });
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

  } catch (err) {
    console.error(`[${BRAND}] Interaction error:`, err);
    if (interaction.isRepliable()) {
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: '❌ An error occurred.' }).catch(() => {});
        } else {
          await interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral }).catch(() => {});
        }
      } catch {}
    }
  }
});

// ============================================================
//  READY
// ============================================================
client.once('ready', () => {
  const line = '═'.repeat(48);
  console.log(line);
  console.log(`║   ${BRAND} v${__BRAND_LOCK__.VERSION}`.padEnd(48) + '║');
  console.log(`║   © ${OWNER} — All Rights Reserved`.padEnd(48) + '║');
  console.log(line);
  console.log(`[${BRAND}] ${client.user.tag} online`);
  console.log(`[${BRAND}] 23+ Security Systems Active`);
  console.log(`[${BRAND}] 🔑 Command Access: SERVER OWNER + BOT OWNER ONLY`);
  console.log(`[${BRAND}]    Hardcoded Owner IDs: ${HARDCODED_OWNER_IDS.join(', ')}`);
  console.log(`[${BRAND}] Anti-Bot: kicks BOT only, times out adder`);
  console.log(`[${BRAND}] Alt-Account: timeout ${Math.floor(CONFIG.ALT_TIMEOUT/60000)}m (no kick)`);
  console.log(`[${BRAND}] Auto Staff Remove: ${CONFIG.STAFF_ROLES.length > 0 ? 'ENABLED' : 'DISABLED (no staff roles configured)'}`);
  registerSlash();
  saveStats();
});

process.on('unhandledRejection', (err) => console.error(`[${BRAND}] Unhandled:`, err));
process.on('uncaughtException', (err) => console.error(`[${BRAND}] Uncaught:`, err));
process.on('SIGINT', () => { flushStatsSync(); process.exit(0); });
process.on('SIGTERM', () => { flushStatsSync(); process.exit(0); });

client.login(APP_CONFIG.token).catch((err) => {
  console.error(`[${BRAND}] Discord login failed: ${err.message}`);
  console.error('Check your bot token and Discord Developer Portal settings.');
  process.exit(1);
});
}

main().catch(err => { console.error('[ALOOZ HOSTING] Startup failed:', err); process.exit(1); });