// Description:
// Default system event passthrough

// Data input format: ({ obj, size }) or ( doc )
function main({obj, size}) {
    //
    if(!obj["@timestamp"]){
        let t = new Time()
        obj["@timestamp"] = t.UnixMilli()
    }
    
    let source = obj["@source"]
    
    if !source {
       return "drop"
    }
    if !source.startsWith("Audit.") {
       return "drop"
    }
    if source != "Audit.AzureActiveDirectory"{
       return "drop"
    }
    let pqJson = {}
    let fields = obj["@fields"]
    
    try {
       transform(fields, pqJson)
    } catch(e) {
       printf("Transform Error %s: %s", e.name, e.message);       
    }
    // send whatever is completed
    printf("%s", toString(pqJson))
    Platform_Sink("", pqJson)
    // continue to "default" index
    return "abort"
}

function copyField(src,srcField, dst, dstField) {
   let f = src[srcField]
   if f {
      dst[dstField] = f
   }
}

function propertiesDecode(properties) {
  let fieldMap = {}
  for _, property = range properties {
    fieldMap[property.Name] = property.Value
  }
  return fieldMap
}

function transform(src, dst) {
    
    let t = new Time("2006-01-02T15:04:05", src.CreationTime, "")
    dst.TimeGenerated = t.UnixMilli()
    copyField(src,"Id", dst, "Id")
    copyField(src,"OrganizationId", dst, "AADTenantId")
    copyField(src,"UserId", dst, "UserPrincipalName")
    copyField(src,"UserKey", dst, "UserId")
    copyField(src,"ApplicationId", dst, "AppId")
    copyField(src,"ObjectId", dst, "ResourceId")
    copyField(src,"Operation", dst, "OperationName")
    //copyField(src,"ActorIpAddress", dst, "IPAddress")
    //copyField(src,"ClientIP", dst, "IPAddress")

    copyField(src,"ResultStatus", dst, "ResultDescription")
    copyField(src,"ErrorNumber", dst, "ResultType")
    let status = {}
    status.errorCode = parseInt(src.ErrorNumber)
    let ExtendedProperties = src.ExtendedProperties
    if ExtendedProperties {
       ExtendedPropertiesFields = propertiesDecode(ExtendedProperties)
       copyField(ExtendedPropertiesFields, "ResultStatusDetail", status, "additionalDetails")
    }
    dst.Status = toString(status)
    
    let DeviceProperties = src.DeviceProperties
    if DeviceProperties {
       DevicePropertiesFields = propertiesDecode(DeviceProperties)
       copyField(DevicePropertiesFields,"UserAgent", dst, "UserAgent")
       copyField(DevicePropertiesFields,"SessionId", dst, "CorrelationId")
       let deviceDetail = {}
       copyField(DevicePropertiesFields,"OS", deviceDetail, "operatingSystem")
       copyField(DevicePropertiesFields,"BrowserType", deviceDetail, "browser")
       dst.DeviceDetail = toString(deviceDetail)
    }
    
    let cip = src.ClientIP
    if (!cip) {
        cip = src.ActorIpAddress
    }
    if (cip) {
        // Case where ClientIP = [<IP>]:<Port>
        let open = indexOf(cip, "[")
        let closed = indexOf(cip, "]")
        if (open >= 0 && closed >= 0){
            cip = subString(cip, open+1, closed)
            dst.IPAddress = cip
        } else {
            // Case where ClientIP = <IP>:<Port>
            let k = indexOf(cip, ":")
            if(k > 0 && !isIPv6(cip)){
                cip = subString(cip, 0, k)
                dst.IPAddress = cip
            }
        }
        try {
            let geoResult = geoip(cip)
            let location = {}
            if (len(geoResult)){ // must have non-empty results
               copyField(geoResult,"city", location, "city")
               copyField(geoResult,"country", location, "countryOrRegion")
               copyField(geoResult,"countryCode", location, "countryCode")
               copyField(geoResult,"isp", location, "isp")
               copyField(geoResult,"org", location, "org")
               location.geoCoordinates = {
                 latitude: geoResult.latitude,
                 longitude: geoResult.longitude
               }
            }
            dst.location=toString(location)
        } catch (e) {
            printf("GeoIP lookup Error %s: %s", e.name, e.message)
        }
    }    
 
}
