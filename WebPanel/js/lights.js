require.config({
    baseUrl : '../../',
    paths : {
        jquery : '3rdparty/jquery/jquery-1.11.2.min',
        knockout : '3rdparty/knockout/knockout-3.4.0',
        fgcommand : 'lib/fgcommand',
        knockprops : 'lib/knockprops' 
    },
    waitSeconds : 30,
});

require([
        'knockout', 'jquery'
        ,'knockprops','fgcommand'
], function(ko, jquery
        ,knockprops, fgcommand
    ) {
        
    
    var touchDevice = false;
    var refreshRate = 1000; //1000ms
    var koRefreshRate = 40;
    var nextRefreshTS = 0;
    
    ko.options.deferUpdates = true;

    ko.utils.knockprops.setAliases({
        apuMaster: "/controls/apu/master",
        apuStart:"/systems/apu/start",
        strobe:"/controls/switches/strobe",
        beacon:"/controls/switches/beacon",
        wing:"/controls/switches/wing-lights",
        nav:"/controls/lighting/nav-lights-switch",
        rwyoff:"/controls/lighting/turnoff-light-switch",
        landl:"/controls/switches/landing-lights-l",
        landr:"/controls/switches/landing-lights-r",
        nose:"/controls/lighting/taxi-light-switch",
        seatblt:"/controls/switches/seatbelt-sign",
        nosmoking:"/controls/switches/no-smoking-sign",
        eexitlt:"/controls/switches/emer-lights",
        dome:"/controls/lighting/dome-norm",
        dcbat:"/systems/electrical/bus/dc-bat",
        dcess:"/systems/electrical/bus/dc-ess",
        apuAvail:"/systems/apu/available"
    });
    

    var viewModel = {
        apuMaster: ko.observable(false).extend({ rateLimit: koRefreshRate }),
        apuStart: ko.observable(false).extend({ rateLimit: koRefreshRate }),
        strobe:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        beacon:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        wing:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        nav:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        rwyoff:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        landl:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        landr:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        nose:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        seatblt:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        nosmoking:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        eexitlt:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        dome:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        dcbat:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        dcess:ko.observable(0).extend({ rateLimit: koRefreshRate }),
        apuAvail:ko.observable(false).extend({ rateLimit: koRefreshRate }),
    };
    
    ko.utils.knockprops.addListener('apuMaster',viewModel.apuMaster);
    ko.utils.knockprops.addListener('apuStart',viewModel.apuStart);
    ko.utils.knockprops.addListener('strobe',viewModel.strobe);
    ko.utils.knockprops.addListener('beacon',viewModel.beacon);
    ko.utils.knockprops.addListener('wing',viewModel.wing);
    ko.utils.knockprops.addListener('nav',viewModel.nav);
    ko.utils.knockprops.addListener('rwyoff',viewModel.rwyoff);
    ko.utils.knockprops.addListener('landl',viewModel.landl);
    ko.utils.knockprops.addListener('landr',viewModel.landr);
    ko.utils.knockprops.addListener('nose',viewModel.nose);
    ko.utils.knockprops.addListener('seatblt',viewModel.seatblt);
    ko.utils.knockprops.addListener('nosmoking',viewModel.nosmoking);
    ko.utils.knockprops.addListener('eexitlt',viewModel.eexitlt);
    ko.utils.knockprops.addListener('dome',viewModel.dome);
    ko.utils.knockprops.addListener('dcbat',viewModel.dcbat);
    ko.utils.knockprops.addListener('dcess',viewModel.dcess);
    ko.utils.knockprops.addListener('apuAvail',viewModel.apuAvail);

    function resizeViewport() 
    {
        var w,h;
        ar=2.138;

        w=window.innerWidth;
        h=window.innerHeight;
        
        if (w/h > ar) {
            w=h*ar;
        } else {
            h=w/ar;
        }

        jquery(".container").width(w);
        jquery(".container").height(h);
        
        jquery(".container").css("font-size",w/57);
        jquery(".container").css("visibility",'visible');
    }
    
    function setSwitch(elm, val) {
        var sw=jquery(elm).find(".ctl-switch").first();
        var h=jquery(elm).height();
        var lh=jquery(sw).height(); 
        var minVal = 0;
        var maxVal = 1;
        
        if (jquery(elm).attr("minVal") !== undefined ) {
            minVal=jquery(elm).attr("minVal");
        }
        
        if (jquery(elm).attr("maxVal") !== undefined ) {
            maxVal=jquery(elm).attr("maxVal");
        }
        
        var aval=(val-minVal)/(maxVal-minVal);
        var tpos=(1-aval)*(h-lh);
        
        jquery(elm).attr("val",val);
        jquery(sw).css('top',tpos.toString()+"px");
    }
    
    function moveSwitch(elm,e)
    {
        var val;
        var x,y;
        var clicked;
        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            x = e.clientX;
            y = e.clientY;
        }
        var minVal = 0;
        var maxVal = 1;
        
        if (jquery(elm).attr("minVal") !== undefined ) {
            minVal=jquery(elm).attr("minVal");
        }
        if (jquery(elm).attr("maxVal") !== undefined ) {
            maxVal=jquery(elm).attr("maxVal");
        }
        
        if (e.type=='touchstart' || e.type=='mousedown') {
            jquery(elm).attr("clicked",1);
        }
        clicked=jquery(elm).attr("clicked");
        if (clicked==1) {
            var sw=jquery(elm).find(".ctl-switch").first();
            var h=jquery(elm).height();
            var sh=jquery(sw).height();
            var ypos=y-jquery(elm).offset().top;
            
            var ymin=sh/2;
            var ymax=h-ymin;
            
            if (ypos<ymin) {
                ypos=ymin;
            }
            if (ypos>ymax) {
                ypos=ymax;
            }
            val=1-(ypos-ymin)/(h-sh);
            val=minVal+(maxVal-minVal)*val;
            setSwitch(elm,val);
        }
        if (clicked==1 && (e.type=='touchend' || e.type=='mouseleave' || e.type=='mouseup')) {
            jquery(elm).attr("clicked",0);
            var val =(jquery(elm).attr("val")-minVal)/(maxVal-minVal);
            var lvls=jquery(elm).attr("lvls");
            var dd = 1/(lvls-1);
            var mindiff = 1.0;
            var cval=0.0;
            var oval=0.0;
            
            for(var i=0;i<lvls;i++) {
                var cd=Math.abs(cval-val);
                if (cd<mindiff) {
                    oval=cval;
                    mindiff=cd;
                }
                cval=cval+dd;
            }
            oval=minVal+(maxVal-minVal)*oval;
            nextRefreshTS=Date.now()+refreshRate;
            setSwitch(elm,oval);
            ctl=jquery(elm).attr('sw');
            if (ko.utils.knockprops.aliases[ctl] !== undefined) {
                viewModel[ctl](oval);
                var prop=ko.utils.knockprops.aliases[ctl];
                fgcommand.propertyAssign(prop,oval);
                fgcommand.sendCommand('nasal',fgcommand.oneArg('script','setprop("sim/sounde/switch1", 1);'));
            }            
        }
    }
    
    var refreshControls = function()
    {
        jquery(".ctl-sw").each(function(idx) {
            var ctl=jquery(this).attr('sw');
            if (viewModel[ctl] !== undefined) {
                var val=viewModel[ctl]();
                setSwitch(this,val);
            }
        });
    }
    
    var refreshProperties= function() {
        var ts = Date.now();
        
        if (ts>nextRefreshTS) {
            for(const p in ko.utils.knockprops.aliases) {
                //console.log(ko.utils.knockprops.aliases[p]);
                if (ts<=nextRefreshTS) {
                    break;
                }
                ko.utils.knockprops.ws.send(JSON.stringify({
                    command : 'get',
                    node : ko.utils.knockprops.aliases[p]
                }));
            }
            refreshControls();
            nextRefreshTS=ts+refreshRate;
        }
        setTimeout(refreshProperties, refreshRate);
    }

    jquery(document).ready(function() {
        var touchDevice = ('ontouchstart' in document.documentElement);
        var ev;
        var evMove;
        
        if (touchDevice) {
            ev='touchstart';
            evMove='touchstart touchmove touchend';
        } else {
            ev='click';
            evMove='mousedown mousemove mouseup mouseleave'; 
        }
        resizeViewport();
        
        jquery(".ctl-sw").on(evMove,function(e) {
            moveSwitch(this,e);
        });
        
        jquery(".ctl-sw").each(function(idx) {
            var ctl=jquery(this).attr('sw');
            if (viewModel[ctl] !== undefined) {
                viewModel[ctl].subscribe(function(nVal) {
                    refreshControls();
                });
            }
        });
        
        jquery(".btn-apu-master").on(ev, function() {
            if (viewModel.dcbat()>=25 || viewModel.dcess()>=25) {
                nextRefreshTS=Date.now()+refreshRate;
                var nval=!viewModel.apuMaster();
                viewModel.apuMaster(nval);
                fgcommand.propertyAssign("/controls/apu/master",nval);
                fgcommand.sendCommand('nasal',fgcommand.oneArg('script','libraries.pushbutton();'));
            }
        });
        
        jquery(".btn-apu-start").on(ev, function() {
            if (viewModel.dcbat()>=25 && viewModel.apuMaster()) {
                fgcommand.sendCommand('nasal',fgcommand.oneArg('script','systems.APUController.APU.startCommand();'));
                fgcommand.sendCommand('nasal',fgcommand.oneArg('script','libraries.pushbutton();'));
            }
        });
   
    });
    
    jquery( window ).resize(function() {
        resizeViewport();
    });
   
    setTimeout(refreshProperties, refreshRate);
    
    ko.applyBindings( viewModel);
    
});