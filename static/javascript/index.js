$(document).ready(function() {
  $('#send').click(function() {
    var message = $('#message').val();
    $.ajax({
      url: '/frontpage_test',
      type: 'get',
      data: { m: message },
      dataType: 'json',
      success: function(response) {
        $('<pre class="message"></pre>').text(response.message).appendTo($('.chats'));
      }
    });
    $('#message').val('');
  });
});
