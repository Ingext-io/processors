// Data input format: ({ obj, size, source }) or ( {raw} )
// cloudwatch event receiver for server logs
function main({obj, size, source }) {
    if (obj.messageType != "DATA_MESSAGE") {
        throw "messageType not DATA_MESSAGE"
    }
    let list = []
    let logEvents = obj.logEvents
    if (!logEvents) {
       throw "No logEvents field in JSON obj"
    }
    for i, event = range logEvents {
        let ev = {
            "@logGroup": obj.logGroup,
            "@logStream": obj.logStream,
            "@subscriptionFilters": obj.subscriptionFilters,
            "@message": event.message,
            "@type": "event",
            "@parser": "fpl-CloudWatchArraySplit",
            "@timestamp": event.timestamp
       }
        if(obj.owner){
            ev["@owner"] = obj.owner
        }
        list = append(list, ev)
    }
    return list
}
