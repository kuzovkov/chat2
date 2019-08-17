var diagConfirm;
var diagMess;

$(function() {

    $("#accordion")
        .accordion({
            header: "> div > h3",
            heightStyle: "fill"
        })
        .sortable({
            axis: "y",
            handle: "h3",
            stop: function( event, ui ) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                ui.item.children( "h3" ).triggerHandler( "focusout" );
                // Refresh accordion to handle new order
                $( this ).accordion( "refresh" );
            }
        });

        $( "#tabs" ).tabs();

         $( "#video-wrap .localVideo" ).draggable({ containment: ".right", scroll: false }).resizable();
        $( "#video-wrap .remoteVideo" ).draggable({ containment: ".right", scroll: false }).resizable();


    diagConfirm = $( "#dialog-confirm" ).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            autoOpen: false,

        });


        diagMess = $( "#dialog-message" ).dialog({
            modal: true,
            autoOpen: false,

        });


});



function dialogConfirm(title, message, ok, cancel){
    $('#dialog-confirm').attr({'title': title});
    $('#dialog-confirm').html('<p><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span>'+message+' </p>');
    diagConfirm.dialog('option','buttons', {
                "Ok": function() {
                    ok();
                    $( this ).dialog( "close" );

                },
                Cancel: function() {
                    cancel();
                    $( this ).dialog( "close" );
                }
            });
    diagConfirm.dialog('open');

}

function closeDialogConfirm(){
    if (diagConfirm)
        diagConfirm.dialog('close');
}


function dialogMessage(title, message, ok) {
    $('#dialog-message').attr({'title': title});
    $('#dialog-message p').html('<p>' + message + '</p>');
    diagMess.dialog('option','buttons', {
                Ok: function() {
                    $( this ).dialog( "close" );
                    if (ok) ok();
                }
            });
    diagMess.dialog('open');

}

function closeDialogMessage(){
    if (diagMess)
        diagMess.dialog('close');
}


