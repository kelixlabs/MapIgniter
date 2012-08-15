/**
 * MapIgniter
 *
 * An open source GeoCMS application
 *
 * @package		MapIgniter
 * @author		Marco Afonso
 * @copyright	Copyright (c) 2012, Marco Afonso
 * @license		dual license, one of two: Apache v2 or GPL
 * @link		http://marcoafonso.com/miwiki/doku.php
 * @since		Version 1.0
 * @filesource
 */

/* ------------------------------------------------------------------------ */

var wfsgetfeature = function(instance, layeralias, popupfunction, htmlurl) {
    this.name = instance;
    this.layeralias = layeralias;
    this.popupfunction = popupfunction;
    this.htmlurl = htmlurl;
};

wfsgetfeature.prototype.config = function (mapblock) {

    // Set public vars
    this.mapblock = mapblock;
    
    // Get layer
    var index = null;
    for (var i=0; i<this.mapblock.map.layers.length; i++) {
        for (var j=0; j<this.mapblock.config.layers.length; j++) {
            if (this.mapblock.map.layers[i].name == this.mapblock.config.layers[j].name) {
                if (this.layeralias == this.mapblock.config.layers[i].alias) {
                    index = i;
                    break;break;
                }
            }
        }
    }
    if (index === null) {
        alert('Layer ' + this.layeralias + ' for ' + this.name + ' was not found!');
        return;
    }
    this.layer = mapblock.map.layers[index];
    

    // Add specific get feature controls
    mapblock.controls.wfscontrol = new OpenLayers.Control.GetFeature({
        // HACK: needs "PropertyName" parameter for version 1.1.0
        protocol: OpenLayers.Protocol.WFS.fromWMSLayer(this.layer, {version: "1.0.0", geometryName: "the_geom"}),
        /*
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.0.0",
            url:  base_url+"mapserver/map/demo?",
            featureType: "layer1",
            featurePrefix: "",
            featureNS: "http://www.openplans.org/topp",
            geometryName: "the_geom",
            srsName: "EPSG:900913"
        }),
        */
        // HACK: to do not set a limit of features. There is different behaviour using box:true and click
        //hover: true,
        maxFeatures: null,
        clickTolerance: 20,
        toggleKey: "ctrlKey"
    });

    var me = this;
    mapblock.controls.wfscontrol.events.register("featureselected", this, function(e) {
        me.preparePopup(e);
    });
    mapblock.controls.wfscontrol.events.register("featureunselected", this, function(e) {
        while( mapblock.map.popups.length ) {
            mapblock.map.removePopup(mapblock.map.popups[0]);
        }
    });
    mapblock.map.addControl(mapblock.controls.wfscontrol);
    mapblock.map.addControl(new OpenLayers.Control.MousePosition());
    mapblock.controls.wfscontrol.activate();
}

wfsgetfeature.prototype.preparePopup = function(e) {
    
    // create function
    var fn = window[this.popupfunction];
    // call the function
    fn(e.feature, this);
}

wfsgetfeature.prototype.popup = function(feature, html) {
    var centroid = feature.geometry.getCentroid();
    var popup = new OpenLayers.Popup("popup_"+feature.attributes.gid,
               new OpenLayers.LonLat(centroid.x, centroid.y),
               null,
               html,
               true);
    popup.minSize = new OpenLayers.Size(380,200);
    popup.panMapIfOutOfView = true;
    this.mapblock.map.addPopup(popup);
    jQuery("#popup_"+feature.attributes.gid).css('z-index', 6000);
    popup.updateSize();
}

var popupfeature = function (feature, wfsgetfeature) {
    
    // Prepare html to show
    if (wfsgetfeature.htmlurl) {
        
        var centroid = feature.geometry.getCentroid();
        var popup = new OpenLayers.Popup("popup_"+feature.attributes.gid,
                   new OpenLayers.LonLat(centroid.x, centroid.y),
                   new OpenLayers.Size(380,120),
                   '<p>Loading...</p>',
                   true);
        popup.panMapIfOutOfView = true;
        popup.autoSize = true;
        wfsgetfeature.mapblock.map.addPopup(popup);
        jQuery("#popup_"+feature.attributes.gid).css('z-index', 6000);
        
        // Load HTML from URL
        jQuery("#popup_"+feature.attributes.gid+'_contentDiv').load(wfsgetfeature.htmlurl+'/'+feature.attributes.gid+'/'+wfsgetfeature.layeralias, null, function(response) {
            popup.updateSize();
            popup.panIntoView();
        });
        
    }
    else {

        // Create HTML from feature attributes
        var html = '';
        
        for(var attr in feature.attributes) {
            if (feature.attributes.hasOwnProperty(attr)) {
                html += "<p>"+feature.attributes[attr]+"</p>";
            }
        }
        html = html + '<div style="float:right;"><small><a href="'+base_url+'tickets/create/'+wfsgetfeature.layeralias+'/'+feature.attributes.gid+'">Report a problem</a></small></div>';
        wfsgetfeature.popup(feature, html);
    }
}