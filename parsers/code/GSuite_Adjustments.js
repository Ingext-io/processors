// Description:
// Default Google Workspace (GSuite) integration event adjustments

// Data input format: ({ obj, size }) or ( doc )
function main({obj, size}) {
    //
    if(!obj["@timestamp"]){
        let t = new Time()
        obj["@timestamp"] = t.UnixMilli()
    }
    
    let g = obj["@gsuites"]
    if(!g){
        return { status: "error" }
    }

    let gip = g.ipAddress
    if(gip){
        try {
            let results = geoip(gip)
            if (len(results)){ // must have non-empty results
                g["_ip"]=results
            }
        } catch (e) {
            // Oh well, whatever...
        }
    }

    obj["@type"] = "event"
    obj["@sender"] = "gsuites"
    obj["@source"] = "gsuites"

    obj["@parser"] = "fpl-GSuiteAdjustments"
    obj["@parserVersion"] = "20241031-1"

    obj["@event_type"] = "@gsuites"
    obj["@eventType"] = "GoogleWorkspace"
    
    return { status: "pass" }
}
