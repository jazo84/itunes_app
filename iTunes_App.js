var pg = require('pg');
var inquirer = require('inquirer');

var dbUrl = {
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: 'iTunes',
	host: 'localhost',
	port: 5432
};

var pgClient = new pg.Client(dbUrl);
pgClient.connect();

console.log ("Welcome to iTunes. Have an Account? Please Sign In. No Account? Please Sign-Up");

var login = () => {
	inquirer.prompt([
	  {
	  	type: "list",
	  	message: "Hi, what would you like to do?",
	    choices:["Sign Up", "Sign In"],
	  	name: "signin_up"
	  }
	]).then((res) => {
		if (res.signin_up === "Sign Up") {
			inquirer.prompt ([
			{
				type: "input",
				message: "What is your name?",
				name: "name"
			},
	    {
	    	type: "input",
	    	message: "Enter a username",
	    	name: "username"
	    },
	    {
	    	type: "password",
	    	message: "Enter a password?",
	    	name: "password"
	    },
			{
			 type: "list",
			 message: "Add money to your account",
			 choices: ['10','15','20','25','50','100'],
			 name: "balance"
		 }
		]).then((results) => {
			pgClient.query('INSERT INTO users (name, username, password, balance) VALUES ($1, $2, $3, $4)',[results.name, results.username, results.password, results.balance], function (err, results) {
					if(err) throw err
						console.log("Your account has been created! Please Sign In");
						login();
					});
			});
		};
		if (res.signin_up === "Sign In") {
			inquirer.prompt([
				{
		    	type: "input",
		    	message: "Enter a username",
		    	name: "username"
		    },
		    {
		    	type: "password",
		    	message: "Enter a password?",
		    	name: "password"
		    }
			]).then((signInRes) => {
				pgClient.query(`SELECT * FROM users WHERE username='${signInRes.username}'`, function(errTwo, result){
					if(result.rows.length > 0) {
						if(result.rows[0].password === signInRes.password){
							var songOptions = () => {
								inquirer.prompt([
									{
								  	type: "list",
								  	message: "Select from the following options:",
								    choices:["View available songs", "View Songs in your account"],
								  	name: "songs"
									}
							]).then((songsRes) => {
								if(songsRes.songs === "View available songs") {
									pgClient.query('SELECT * FROM songs',((errThree, resultsThree) => {
										var songs = [];
										resultsThree.rows.forEach((songList) => {
											songs.push(songList.song_title);
										})
										inquirer.prompt([
											{
												type: "list",
												message: "Choose a song to add to your account",
												choices: songs,
												name: "song"
											}
										]).then(function(songAdd){
											var song_id;
											resultsThree.rows.forEach((songList) => {
												if(songList.song_title === songAdd.song) {
													song_id = songList.id
												}
											})
											pgClient.query("INSERT INTO bought_songs(user_id, song_id) VALUES ($1, $2)",
											[result.rows[0].id, song_id], (errFour, resFour)=> {
												if (errFour) throw errFour;
												console.log("Song has been added to your account");
												songOptions();
											});
										})
									}))
								} if (songsRes.songs === "View Songs in your account") {
										console.log ("Here are the Songs You Have Added to your account");
										pgClient.query('SELECT songs.song_title FROM songs INNER JOIN bought_songs ON bought_songs.song_id=songs.id WHERE bought_songs.user_id=' + result.rows[0].id, (errFive, result)=> {
										if (result.rows.length > 0) {
											for(var i =0; i < result.rows.length; i++){
												console.log((i + 1) + ". " +
												result.rows[i].song_title)
											}
										} else {
											console.log ("You do not have any songs in your account")
											songOptions();
										}
									})
									//login();
								}
							});
							};
							songOptions();
						} else {
							console.log("Please enter the correct password");
							login();
						}
						};
					});
				})
			};
	});
	};
login();
