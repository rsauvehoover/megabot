var Discord = require('discord.js');
var auth = require('./auth.json');

//
// Server variables
//
const channelroles = ['artist', 'director', 'developer', 
                    'musician', 'producer', 'writer']; 
const courseroles = ['blaw-301', 'cmput-250', 'cmput-366', 'mlcs-399'];

// Initialize Discord Bot and log initialization
var client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

//
// Handle new joins
//
client.on('guildMemberAdd', member => {

  const ruleschan = findChannel(member.guild, 'rules');
  const channel = findChannel(member.guild, 'welcome');
  if (!channel) return;

  var newRole = findRole(member.guild, 'new');
  member.addRole(newRole)
    .then(channel.send(`Hello and welcome to the Megachannel, ${member}! Please make sure you read the ${ruleschan.toString()} first - they're short, simple, and easy to follow. Once you have read and agreed to the rules, you will have access to all the regular channels on the server!`))
    .catch(console.error);
});

//
// Respond to specific messages
//
client.on('message', msg => {
  
  if (msg.content.substring(0,1) == '!') {
  
    var args = msg.content.substring(1).split(' ');
    var cmd = args[0];
    var sender = msg.member;
    var isNew = sender.roles.find('name', 'new');
    var isConfirmed = sender.roles.find('name', 'confirmed');
  
    const generalchan = findChannel(msg.guild, 'general');
    const welcomechan = findChannel(msg.guild, 'welcome');
    const reqchan = findChannel(msg.guild, 'requests');
    const profileschan = findChannel(msg.guild, 'profiles');
    
    //
    // New Member Agreement - on welcome channel, role new
    if (cmd == 'agree') {
      
      if (msg.channel == welcomechan && isNew) {
        sender.removeRole(findRole(msg.guild, 'new'))
          .catch(console.error);
      
        sender.addRole(findRole(msg.guild, 'confirmed'))
          .then(console.log(`New member ${sender.username}`))
          .catch(console.error);
        
        sender.send('You have agreed to the rules of this server! Please make sure you check back often to keep up-to-date with changes. \n\nYou can now use any publicly-available channel; for example, you don\'t have to be taking the course that corresponds to a course channel in order to chat there.  Feel free to head over to the ' + profileschan.toString() + ' channel and introduce yourself - this is handy because the Megachannel has users who are in different programs and courses who might not know each other!  \n\nLastly, you may want to mute any channels you\'re not particularly interested in, as we can get into spirited discussions that can blow up your notifications.');
      
        generalchan.send(`Please welcome our newest member ${msg.member} to the Megachannel!`);
      
      } else {
        sender.send('You have already agreed to the rules on this server.')
      }
    }
  
    //
    // Help Message
    else if (cmd == 'help') {
    
      var helpheader = 'You can use the following commands (replace anything in <angle brackets> with an argument - e.g. type \`!profile @MegaBot\`, not \`!profile <@MegaBot>\\`):\n\n' +
                        '\`!help\`: show this help message\n';
      
      var helptext = '';
    
      if (isNew) {
        helptext = '\`!agree\`: Agree to the rules of the server.';
      
      } else {
        helptext = '\`!profile <@user>\`: find link to user\'s profile\n' +
                  '\`!role <role>\`: set yourself as <role> (one per command) so you can be mentioned using @<role>. You can have as many <role>s as you want. If you enter a <role> that you already have, it will be removed.\n' +
                  '\tRoles: artist, director, developer, musician, producer, writer\n' +
                  '\`!course <course>\`: set yourself as being in <course> (one per command) so you can be mentioned using @<course>. You can have as many <course>s as you want. If you enter a <course> that you already have, it will be removed.\n' + 
                  '\tCourses: any currently listed in the Courses channel group\n';
      }
      
      msg.author.send(helpheader + helptext);
    }
  
    //
    // Reset Permissions to Confirmed
    else if (cmd == 'reset' && isConfirmed) {
    
      for (var [id, role] of msg.guild.roles) {
        if (role.name != '@everyone' && role.name != 'confirmed') {
          console.log('Remove!');
          msg.member.removeRole(role)
            .catch(console.error);
        }
      }
    
      msg.author.send('Your permissions to the server have been reset. Please add back any roles you want on your profile.');

    }
    
    //
    // Toggle role or course
    else if (cmd == 'role' || cmd == 'course') {
    
      if (isConfirmed) {
        if (args.length == 2) {
        
          role = args[1];
          
          if ((cmd == 'role' && !channelroles.includes(role)) || 
              (cmd == 'course' && !courseroles.includes(role))) {
            sender.send(`The ${cmd} \`${role}\` does not exist or cannot be added using this command.`);
            return;
          }
          
          if (!findRole(msg.guild, role)) {
            sender.send(`The ${cmd} \`${role}\` could not be found on this server. Please try again.`);
            return;
          }
          
          // Has role - remove it
          if (sender.roles.find('name', role)) {
          
            sender.removeRole(findRole(msg.guild, role))
              .then(sender.send(`The ${cmd} '${role}' was removed. You will no longer be notified when \`@${role}\` is mentioned.`))
              .catch(console.error);
          
          // Doesn't have role - add it
          } else {
          
            sender.addRole(findRole(msg.guild, role))
              .then(sender.send(`The ${cmd} '${role}' was added. You will now be notified when someone mentions \`@${role}\`.`))
              .catch(console.error);
          }
          
          
        } else {
        
          if (cmd == 'role') {
            sender.send("The command must be of the format: \`!role <rolename>\` where <rolename> can be artist, director, developer, musician, producer, or writer.");
          } else if (cmd == 'course') {
            sender.send("The command must be of the format: \`!course <coursename>\` where <coursename> must match one of the course channel names.");
          }
        }
      }
    }
  
    //
    // Get Profile
    else if (cmd == 'profile') {
    
      // Only give profiles to confirmed members
      if (isConfirmed) {
    
        var user = msg.mentions.members.first();
        var profile = profileschan.fetchMessages()
                      .then(messages => 
                          messages.filter(m => m.author.id === user.id))
                      .then(message => {
                    
                        if (message.size == 0) {
                          msg.author.send(`${user.toString()} has not yet posted to ${profileschan.toString()}.`);
                        }
                    
                        for (var [id, m] of message) {
                          msg.author.send(`You can find ${user.toString()}'s profile at: ${m.url}.`);
                        }
                      })
                      .catch(console.error);
                    
      // Non-confirmed members get an error message for now.                    
      } else {
        msg.author.send("You must agree to the rules to view any profiles.")
      }    
    }
    
    // Started with ! but didn't match any of the above
    else {
      msg.author.send('Your command \`' + msg.content + '\` was not recognized. Please check it and try again, or type \`!help\` for options.')
    }
  } 
});

//
// Client login
//
client.login(auth.token);

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