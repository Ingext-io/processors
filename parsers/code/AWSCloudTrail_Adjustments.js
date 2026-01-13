// Description:
// Default AWS CloudTrail integration event adjustments

// Data input format: ({ obj, size }) or ( doc )
function main({obj, size}) {
    //
    if(!obj["@timestamp"]){
        let t = new Time()
        obj["@timestamp"] = t.UnixMilli()
    }

    let ct = obj["@cloudtrail"]
    if (ct){
        if (ct.userIdentity) {
            let fl = {}
            // add "@fluency.AWSUserIdentity" for behavior key, since "arn" may not be provided
            if (ct.userIdentity.arn) {
                fl.AWSUserIdentity = ct.userIdentity.arn
            } else {
                fl.AWSUserIdentity = ct.userIdentity.accountId + "_" + ct.userIdentity.principalId
            }
            obj["@fluency"] = fl
        }
    }
    obj["@type"] = "event"
    obj["@sender"] = "aws"
    obj["@source"] = "cloudtrail"
    obj["@parser"] = "fpl-AWSCloudTrailAdjustments"
    obj["@parserVersion"] = "20251002-1"

    obj["@eventType"] = "AWSCloudTrail"
    obj["@event_type"] = "cloudtrail"

    return { status: "pass" }
}
