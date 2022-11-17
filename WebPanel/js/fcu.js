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
        
    var refreshRate = 500; //500ms
    var koRefreshRate = 40;
    var nextRefreshTS = 0;

    var target="";
    var mag=0;
    var timer=null;
    var cnt=0;
    
    function adjustVal()
    {
        var timeout;
        var script;
        
        //console.log('adjustVal');
        
        nextRefreshTS=Date.now()+refreshRate;
        if (target=="spd") {
            script='fcu.FCUController.SPDAdjust('+mag+')';      
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',script));
            var spd=viewModel.spd();
            spd=spd+mag;
            viewModel.spd(spd);
        } else if (target=="hdg") {
            script='fcu.FCUController.HDGAdjust('+mag+')';      
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',script));
            var hdg=viewModel.hdg();
            hdg=hdg+mag;
            if (hdg>360) {
                hdg-=360;
            }
            if (hdg<0) {
                hdg+=360;
            }
            viewModel.hdg(hdg);
        } else if (target=="alt") {
            script='fcu.FCUController.ALTAdjust('+mag+')';      
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',script));
            var alt=viewModel.alt();
            var maga=mag;
            if (Math.abs(maga)==2) {
                maga=mag/2;
            }
            alt=alt+maga*100;
            viewModel.alt(alt);
        } else if (target=="vs") {
            script='fcu.FCUController.VSAdjust('+mag+')';      
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',script));
            if (viewModel.vert()==1) {
                var vs=parseInt(viewModel.vs());
                var avs=Math.abs(vs);
                var vsText=avs.toString();
                
                if (avs<10) {
                    vsText="0"+vsText;
                }
                if (vs>0) {
                    vsText="+"+vsText;
                } else if (vs<0) {
                    vsText="-"+vsText;
                }
                viewModel.vs(vsText);                
            } else {
                var fpa = viewModel.fpa();
                fpa=fpa+mag/10;
                viewModel.fpa(fpa);                
            }
        }
        if (cnt==0) {
            timeout=500;
        } else {
            if (mag==1) {
                timeout=100;
            } else {
                timeout=150;
            }           
        }
        cnt++;
        timer=setTimeout(adjustVal, timeout);
    }
    
    var abtnPressed = function(e) {
        //viewModel.msg('pressed');
        //console.log('abtnPressed');
        target=jquery(this).attr("target");
        mag=parseInt(jquery(this).attr("mag"));
        adjustVal();
        cnt=0;
    };
    
    var abtnReleased = function() {
        //viewModel.msg('release');
        //console.log('abtnReleased');
        if (timer!=null) {
            clearTimeout(timer);
        }       
        timer=null;
    };

    function resizeViewport() 
    {
        var w,h;
        ar=2.2;

        w=window.innerWidth;
        h=window.innerHeight;
        
        if (w/h > ar) {
            w=h*ar;
        } else {
            h=w/ar;
        }

        jquery(".container").width(w);
        jquery(".container").height(h);
        jquery(".container").css("font-size",w/90);
        jquery(".container").css("visibility",'visible');
    }
    
        ko.options.deferUpdates = true;
    
    ko.utils.knockprops.setAliases({
        alt:"/it-autoflight/input/alt",
        hdg:"/it-autoflight/input/hdg",
        showHdg:"/it-autoflight/custom/show-hdg",
        lat:"/it-autoflight/input/lat",
        lnavArmed:"/it-autoflight/output/lnav-armed",
        spdmgd:"/it-autoflight/input/spd-managed",
        spd:"/it-autoflight/input/kts",
        vert:"/it-autoflight/output/vert",
        vs:"/it-autoflight/output/vs-fcu-display",
        fpa:"/it-autoflight/input/fpa",
        mach:"/it-autoflight/input/mach",
        ktsmach:"/it-autoflight/input/kts-mach",
        "ap1":"/it-autoflight/output/ap1",
        "ap2":"/it-autoflight/output/ap2",
        athr:"/it-autoflight/output/athr",
        trk:"/it-autoflight/custom/trk-fpa",
        loc:"/it-autoflight/output/loc-armed",
        appr:"/it-autoflight/output/appr-armed",
        fcuWorking:"/FMGC/FCU-working",
    });

    var viewModel = {
        alt: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        hdg: ko.observable(360).extend({ rateLimit: koRefreshRate }),
        showHdg: ko.observable(false).extend({ rateLimit: koRefreshRate }),
        lat: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        lnavArmed:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        spdmgd: ko.observable(false).extend({ rateLimit: koRefreshRate }),
        spd: ko.observable(100).extend({ rateLimit: koRefreshRate }),
        vert: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        vs: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        fpa: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        mach: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        ktsmach: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        "ap1":ko.observable(false).extend({ rateLimit: koRefreshRate }),
        "ap2":ko.observable(false).extend({ rateLimit: koRefreshRate }),
        athr:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        trk:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        loc:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        appr:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        fcuWorking:ko.observable(false).extend({ rateLimit: koRefreshRate })
    };
    
    ko.utils.knockprops.addListener('alt',viewModel.alt);
    ko.utils.knockprops.addListener('hdg',viewModel.hdg);
    ko.utils.knockprops.addListener('showHdg',viewModel.showHdg);
    ko.utils.knockprops.addListener('spd',viewModel.spd);
    ko.utils.knockprops.addListener('lat',viewModel.lat);
    ko.utils.knockprops.addListener('lnavArmed',viewModel.lnavArmed);
    ko.utils.knockprops.addListener('spdmgd',viewModel.spdmgd);
    ko.utils.knockprops.addListener('vert',viewModel.vert);
    ko.utils.knockprops.addListener('vs',viewModel.vs);
    ko.utils.knockprops.addListener('fpa',viewModel.fpa);
    ko.utils.knockprops.addListener('mach',viewModel.mach);
    ko.utils.knockprops.addListener('ktsmach',viewModel.ktsmach);
    ko.utils.knockprops.addListener('ap1',viewModel.ap1);
    ko.utils.knockprops.addListener('ap2',viewModel.ap2);
    ko.utils.knockprops.addListener('athr',viewModel.athr);
    ko.utils.knockprops.addListener('trk',viewModel.trk);
    ko.utils.knockprops.addListener('loc',viewModel.loc);
    ko.utils.knockprops.addListener('appr',viewModel.appr);
    ko.utils.knockprops.addListener('fcuWorking',viewModel.fcuWorking);
    
    viewModel.locInd = ko.pureComputed(function() {
        return ((this.lat()==2 || this.loc()) && !this.appr() && this.vert()!=2 && this.vert()!=6);
    }, viewModel);
    
    viewModel.apprInd = ko.pureComputed(function() {
        return (this.appr() || this.vert()==2 || this.vert()==6);
    }, viewModel);
    
    viewModel.vsText = ko.pureComputed(function() {
        var vsText="----";
        if (this.vert()==1) {
            vsText=this.vs()+'00';
        }
        if (this.vert()==5) {
            vsText=this.fpa().toFixed(1);
            if (this.fpa()>0) {
                vsText="+"+vsText;
            }
        }
        return vsText;
    }, viewModel);
   
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
            nextRefreshTS=ts+refreshRate;
        }
        setTimeout(refreshProperties, refreshRate);
    }

    setTimeout(refreshProperties, refreshRate);
    ko.applyBindings( viewModel);
    
    jquery(document).ready(function() {
        var touchDevice = ('ontouchstart' in document.documentElement);
        var ev;
        var evStart;
        var evEnd;
        if (touchDevice) {
            ev='touchstart';
            evStart='touchstart';
            evEnd='touchend';
        } else {
            ev='click';
            evStart='mousedown';
            evEnd='mouseup';
        }
        
        
        resizeViewport();
        
        jquery(".btn-loc").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.LOCButton()'));
        });

        jquery(".btn-ap1").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.AP1()'));
        });
        
        jquery(".btn-ap2").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.AP2()'));
        });
        
        jquery(".btn-athr").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.ATHR()'));
        });

        jquery(".btn-appr").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.APPRButton()'));
        });
        
        jquery(".btn-spdmach").on(ev, function(){        
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.IASMach()'));
        });
        
        jquery(".btn-vsfpa").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.TRKFPA()'));
        });
        
        jquery(".btn-metricalt").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.MetricAlt()'));
        });
        
        jquery(".btn-spd-push").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.SPDPush()'));
        });
        
        jquery(".btn-spd-pull").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.SPDPull()'));
        });
        
        jquery(".btn-hdg-push").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.HDGPush()'));
        });
        
        jquery(".btn-hdg-pull").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.HDGPull()'));
        });
        
        jquery(".btn-alt-push").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.ALTPush()'));
        });
        
        jquery(".btn-alt-pull").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.ALTPull()'));
        });  

        jquery(".btn-vs-push").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.VSPush()'));
        });
        
        jquery(".btn-vs-pull").on(ev, function(){
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','fcu.FCUController.VSPull()'));
        });      

        jquery(".abtn").on(evStart,abtnPressed);
        jquery(".abtn").on(evEnd,abtnReleased);
    });
    
    jquery( window ).resize(function() {
        resizeViewport();
    });
  

});