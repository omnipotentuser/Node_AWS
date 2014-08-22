var fms = require(ec2_main);

function show_result(is_running) {
    console.log("show_result - is instance running? "+ is_running);
}

function started(result){
    console.log("fms status: "+result);
}

fms.has_running_instance(show_result);

fms.start_instance(started);

fms.stop_instance();
