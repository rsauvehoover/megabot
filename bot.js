var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
var client = new Discord.Client();

// Log bot initialization
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
//     console.log(client)
});

// Find and return a role, if it exists
//    Args:
//      guild (Guild)
//      rolename (String)
//
//    Returns:
//      role (Role)
//      The role reference for the guild if found.
function findRole(guild, rolename) {
  return guild.roles.find(role => role.name === rolename);
}

// Find and return a channel, if it exists
//    Args:
//      guild (Guild)
//      channelname (String)
//
//    Returns:
//      channel (Channel)
//      The channel reference for the guild if found.
function findChannel(guild, channelname) {
  return guild.channels.find(ch => ch.name === channelname);
}

// Handle new joins
client.on('guildMemberAdd', member => {

  const ruleschan = findChannel(member.guild, 'rules');

  var newRole = findRole(member.guild, 'new');
  member.addRole(newRole)
    .then(console.log)
    .catch(console.error);

  const channel = findChannel(member.guild, 'welcome');
  if (!channel) return;
  
  channel.send(`Hello and welcome to the Megachannel, ${member}! Please make sure you read the ` + ruleschan.toString() + ` first - they\'re short, simple, and easy to follow. Once you have read and agreed to the rules, you will have access to all the regular channels on the server!`);
});

// Respond to specific messages
client.on('message', msg => {
  
  const generalchan = findChannel(msg.guild, 'general');
  const reqchan = findChannel(msg.guild, 'requests');
  const profileschan = findChannel(msg.guild, 'profiles');
    
  // New Member Agreement
  if (msg.content == '!agree' && 
        msg.channel == findChannel(msg.guild, 'welcome') &&
        msg.member.roles.find("name", "new")) {
      
    msg.member.removeRole(findRole(msg.guild, 'new'))
      .then(console.log)
      .catch(console.error);
      
    msg.member.addRole(findRole(msg.guild, 'confirmed'))
      .then(console.log)
      .catch(console.error);
        
    msg.reply('You have agreed to the rules of this server! Please make sure you check back often to keep up-to-date with changes. \n\nYou can now use any publicly-available channel; for example, you don\'t have to be taking the course that corresponds to a course channel in order to chat there.  Feel free to head over to ' + profileschan.toString() + ' and introduce yourself - this is handy because the Megachannel has users who are in different programs and courses who might not know each other!  \n\nLastly, you may want to mute any channels you\'re not particularly interested in, as we can get into spirited discussions that can blow up your notifications.');
      
    generalchan.send(`Please welcome our newest member ${msg.member} to the Megachannel!`);
  }
  
  // Help Message
  if (msg.content == '!help') {
    msg.reply('pong');
  }
  
  // Reset Permissions to Confirmed
  else if (msg.content == '!reset' && 
            msg.member.roles.find('name', 'confirmed')) {
    
    for (var [id, role] of msg.guild.roles) {
      if (role.name != '@everyone' && role.name != 'confirmed') {
        console.log('Remove!');
        msg.member.removeRole(role)
          .catch(console.error);
      }
    }
    
    msg.reply('Your permissions to the server have been reset.');

  }
  
  // Get Profile - only for confirmed members
  else if (msg.content.substring(0, 8) == '!profile'
            && msg.member.roles.find('name', 'confirmed')) {
    
    var user = msg.mentions.members.first();
    var profile = profileschan.fetchMessages()
                  .then(messages => 
                      messages.filter(m => m.author.id === user.id))
                  .then(message => {
                    
                    if (message.size == 0) {
                      msg.reply(`${user.toString()} has not yet posted to ${profileschan.toString()}.`);
                    }
                    
                    for (var [id, m] of message) {
                      msg.reply(`You can find ${user.toString()}'s profile at: ${m.url}.`);
                    }
                  })
                  .catch(console.error);
    
  }
    
});

// Client login
client.login(auth.token);