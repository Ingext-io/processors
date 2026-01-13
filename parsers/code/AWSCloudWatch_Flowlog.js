// https://docs.aws.amazon.com/vpc/latest/userguide/flow-log-records.html

// Data input format: ({ obj, size, source }) or ( doc )
function main({obj, size, source}) {
    // Event selection criteria
    let msg = obj["@message"]
    if (!msg){
        return {"status":"abort"}
    }
    let lg = obj["@logGroup"]
    if (!lg == "flowlog") {
        return {"status":"abort"}
    }

    let sp = split(msg, " ")
    if (len(sp) < 14) { // too short
        return {"status":"abort"}
    }

    obj["@type"] = "event"

    obj["@parser"] = "fpl-AWSCloudWatchFlowlog"
    obj["@parserVersion"] = "20250410-2"
    obj["@sender"]="aws"
    obj["@source"] = "cloudwatch"
    obj["@eventType"]="CloudWatchFlowlog"
    obj["@event_type"]="flowlog"
    let f = {}
    if (startsWith(msg,"2 ")){ //2 1234567890 eni-0123......
        f = processFlowlogV2(sp)
    } else {
        f = processFlowlog(sp)
    }
    obj["@flowlog"] = f

    return {"status":"pass"}
}

function processFlowlogV2(split) {
    let f = {}
    f._length = len(split)

    f.version = split[0]
    f["account-id"] = split[1]
    f["interface-id"] = split[2]
    f.srcaddr = split[3]
    f.dstaddr = split[4]
    f.srcport = split[5]
    f.dstport = split[6]
    f.protocol = split[7]
    f.packets = split[8]
    f.bytes = split[9]
    f.start = split[10]
    f.end = split[11]
    f.action = split[12]
    f["log-status"] = split[13]

    return f
}

function processFlowlog(split) {
    let f = {}
    f._length = len(split)
    return f
}
