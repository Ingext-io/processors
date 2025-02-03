// Description:
// Default Azure EventHubs integration event adjustments

// Data input format: ({ obj, size }) or ( doc )
function main({obj, props, size}) {
    //
    let azure = obj["@azure"]
    if (!azure || typeof(azure) != "jsonObj"){
        return {"status":"error"}
    }
    let category = azure.category
    // https://learn.microsoft.com/en-us/azure/azure-monitor/reference/supported-logs/microsoft-network-azurefirewalls-logs
    if (category == "AzureFirewallApplicationRule" || category == "AzureFirewallNetworkRule" || category == "AzureFirewallDnsProxy"){
        // drop 'legacy' category types
        return {"status":"drop"}
    }

    let timeField = azure.time
    if (!timeField) {
        let t = new Time()
        obj["@timestamp"] = t.UnixMilli()
    }
    if(!obj["@timestamp"]){
        if (startsWith(category, "AZFW")){
            let t = new Time("2006-01-02T15:04:05.999999+00:00" , timeField)
            obj["@timestamp"] = t.UnixMilli()
        } elseif (startsWith(category, "RiskyUsers")){
            let t = new Time()
            obj["@timestamp"] = t.UnixMilli()
        } else {
            let t = new Time("2006-01-02T15:04:05.999999999Z" , timeField)
            obj["@timestamp"] = t.UnixMilli()
        }
    }
    // adjustments
    if (category == "SQLSecurityAuditEvents"){
        if (azure.properties){
            let cip = azure.properties.client_ip
            if(cip){
                try {
                    let results = geoip(cip)
                    if (len(results)){ // must have non-empty results
                        if(!obj["@normalized"]){
                            obj["@normalized"] = {}
                        }
                        obj["@normalized"].source_ip = cip
                        obj["@normalized"].src_geo = results
                    }
                } catch (e) {
                    // Oh well, whatever...
                }
            }
        }
    }
    if (category == "AuditEvent" || category == "StorageWrite" || category == "StorageRead"){
        let cip = azure.callerIpAddress
        if(cip){
            let k = indexOf(cip, ":")
            if(k > 0 && !isIPv6(cip)){
                azure.callerIpAddressOriginal = cip
                cip = subString(cip, 0, k)
                azure.callerIpAddress = cip
            }
            try {
                let results = geoip(cip)
                if (len(results)){ // must have non-empty results
                    if(!obj["@normalized"]){
                        obj["@normalized"] = {}
                    }
                    obj["@normalized"].source_ip = cip
                    obj["@normalized"].src_geo = results
                }
            } catch (e) {
                // Oh well, whatever...
            }
        }
    }
    obj["@type"] = "event"

    if (props && props.name){
        obj["@integration"] = props.name
    }

    obj["@event_type"] = "azure"
    obj["@eventType"] = "AzureEventHubs"
    obj["@sender"] = "azure"
    obj["@source"] = "eventhubs"
    obj["@parser"] = "fpl-AzureEventHubsAdjustments"
    obj["@parserVersion"] = "20241231-1"
    return {"status":"pass"}
}

