var AWS = require('aws-sdk');

AWS.config.loadFromPath('/var/node/aws_creds.json');

var ec2 = new AWS.EC2(); // or new AWS.EC2(region:'us-west-2'); etc.

var ms_elasticIp = "x.x.x.x";

// error object consists of:
// code [String] short code representing the error
// message [String] human readable error message
// retryable [Boolean] determines if error is retryable

///////////////////////////////////////////////////////////////////////////////////
//////////////////// public functions /////////////////////////////////////////////

// callback Boolean true if yea, false nay
function has_running_instance(callback) {

	//Code of States
	// 0 pending
	// 16 running <--- focus on this.
	// 32 shutting-down
	// 48 terminated
	// 64 stopping
	// 80 stopped
	ec2.client.describeInstances({}, function (error, data) {
		if (error) {
			console.log(error);
			callback(false);
		} else {
			console.log(data);
			var res = data.Reservations; // array of instances
			var running = false;
			for (var i = 0; i<res.length; i++){
				if(res[i].State.code == 16){
					running = true;
					break;
				}
			}
			callback(running);
		}
	});
}

function start_instance(callback) {
	do_start_instance();
	get_instances(config_media_server);
	is_instance_running(callback);
}

function stop_instance() {
	get_instances(do_stop_instance);
}



/////////////////////////////////////////////////////////////
///////////////////   internal functions ////////////////////

function do_start_instance() {
       var params = {};
        params.ImageId = "ami-xxxxxxx";
        params.MinCount = 1;
        params.MaxCount = 1;
        params.KeyName = "openvri-dev";
        params.SecurityGroups = ["sg-xxxxxx"];
        params.InstanceType = "m1.large";
        ec2.client.runInstances(params, function(err, data){
                if(err){
                        console.log(err);
                } else {
			console.log(data);
		}
	});
}

function config_media_server(instances) {
	// for now we only care about one: the first instance.
	if(instances){
		for(var i=0; i < instances.length; i++){
			if(instances[i].State.code === 16){
				do_config_media_server(instances[i].InstanceId);
				break;
			} else if(instances[i].State.code === 0){
				console.log("Instance is not running when trying to assign elastic IP.");
				timers.setTimeout(get_instances(config_media_server), 30000);
			}
		}
	}
}

function do_config_media_server(id){
	var params = {};
	params.InstanceId = id;
	params.PublicIp = ms_elasticIp;
	ec2.client.associateAddress(params, function(err, data){
		if(err){
			console.log(err);
		}else{
			
			// todo - set up ssh / scp files and run scripts
			
			console.log(data);
		}
	});
}

function do_stop_instance(instances) {
	var inst = null;
	for(var i=0; i<instances.length; i++){
		if(instances[i].State.Code == 16){
			inst = instances[i];
			break;
		}
	}
	if(inst === null){
		return;
	}
	var id = inst.InstanceId; // String
	var disaddr = {};
	disaddr.PublicIp = ms_elasticIp; 
	ec2.client.disassociateAddress(disaddr, function(err,data){
		if(err){
			console.log(err);
		}else{
			console.log(data);
			do_terminate_instance(id);
		}
	});
}

function do_terminate_instance(id){
	var term = {};
	term.InstanceIds = [id];
	ec2.client.terminateInstances(term,function(err,data){
		if(err){
			console.log(err);
		}else{
			console.log(data);
		}
	});
}

// callback will be called with array of instances object returned from describeInstances.
function get_instances(callback){
	ec2.client.describeInstances({}, function (error, data) {
		if (error) {
			console.log(error);
			callback(null);
		} else {
			console.log(data);
			callback(data.Reservations); // array of instances
		}

	});
}

function is_instance_running(callback){
	console.log("is_instance_running?");
	ec2.client.describeInstances({}, function (error, data) {
		if (error) {
			console.log(error);
			callback(false);
		} else {
			console.log(data);
			var res = data.Reservations; // array of instances
			var running = false;
			for (var i = 0; i<res.length; i++){
				if(res[i].State.code == 16){
					running = true;
					break;
				}
			}
			if(!running)
				timers.setTimeout(is_instance_running(callback),10000);
			else;
				callback(running);
		}
	});
}
