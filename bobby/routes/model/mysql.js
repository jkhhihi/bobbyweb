var mysql= require("mysql"); 

var pool = mysql.createPool({
	  connectionLimit : 8,
	  host     : 'cider.cjvgnltk0cex.ap-northeast-1.rds.amazonaws.com',
	  user     : 'frank',
	  password : 'ss1gyk4w',
	  /*
	  host     : 'raonomics.ctifxiukgip3.ap-northeast-2.rds.amazonaws.com',
	  user     : 'fesila',
	  password : 'wi7us4ttx',
	  */
	  //host     : 'localhost',
	  //user     : 'root',
	  //password : 'Tg599633',
	  multipleStatements: true
});

exports.select = function(sql, callback) {	
	pool.getConnection(function(err, connection){
		connection.query(sql, function(err, rows, fields) {
			
			if (err) throw err;
			//console.log(err);
			//console.log('result : ');
			//console.log(rows);
			
			connection.release();
			callback(err, rows);
		});	
		
	});
}

exports.insert = function(sql, sets, callback) {
   pool.getConnection(function(err, connection){
      
      connection.query(sql, [sets], function(err, rows, fields) {
         
         if (err) throw err;
         //console.log(err);
         //console.log('result : ');
         //console.log(rows);
         
         connection.release();
         callback(err, rows);
      });   
      
   });
}

exports.update = function(sql, sets, callback) {
	pool.getConnection(function(err, connection){
		
		/*
		connection.config.queryFormat = function (sql, sets) {
			  if (!sets) return sql;
			  return sql.replace(/\:(\w+)/g, function (txt, key) {
			    if (sets.hasOwnProperty(key)) {
			      return this.escape(sets[key]);
			    }
			    return txt;
			  }.bind(this));
			};
			*/
		connection.query(sql, sets, function(err, rows, fields) {
			
			if (err) throw err;
			//console.log(err);
			//console.log('result : ');
			//console.log(rows);
			
			connection.release();
			callback(err, rows);
		});	
		
	});
}

exports.del = function(sql, callback) {
	pool.getConnection(function(err, connection){
		connection.query(sql, function(err, rows, fields) {
			
			if (err) throw err;
			//console.log(err);
			//console.log('result : ');
			//console.log(rows);
			
			connection.release();
			callback(err, rows);
		});	
		
	});
}