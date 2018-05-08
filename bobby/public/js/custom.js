/*!
 * raonomics admin
 */
 
$(document).ready(function (){	
	
	//질문 추가
	var no = 1;
	$('.add-question').click(function (e){
		e.preventDefault();
		addQuestion(no);
		no++;
		$("#q_count").val(no-1);
	});
	
	
	//contents file 관리
	
	//이미지 박스 클릭 (콘텐츠 이미지 설정)
	
	$('.modal-trigger1').leanModal({
		dismissible: true, // Modal can be dismissed by clicking outside of the modal
		opacity: .5, // Opacity of modal background
		in_duration: 300, // Transition in duration
		out_duration: 200, // Transition out duration
		ready: function() { 
			fileList('thumb', 1); 
		}, // Callback for Modal open
		complete: function() {
		} // Callback for Modal close
	});

//토론 이미지 설정 버튼
	$('.modal-trigger2').leanModal({
		dismissible: true, // Modal can be dismissed by clicking outside of the modal
		opacity: .5, // Opacity of modal background
		in_duration: 300, // Transition in duration
		out_duration: 200, // Transition out duration
		ready: function() { 
			fileList1('thumb', 1); 
		}, // Callback for Modal open
		complete: function() {
		} // Callback for Modal close
	});


	//썸네일 이미지 등록
	$('.btn-thumb').click(function(){
		if($('.img-selected').length > 1){
			alert('하나만 선택해주세요~');
			return;
		}
		var src = $('.img-selected').find('img').attr('src');
		$('.preview').css('display','block');
		$('.preview').find('img').attr('src', src);
		$('.preview').find('input').attr('value', src);
		$('#modal1').closeModal();
	});

	$(".thumbnail").click(function(e) {
		e.preventDefault();
		$("#thumbnail").unbind().on("change", function(e) {
			$("#thumbnail_src").val($(this).val());
		});
		$("#thumbnail").click();
	});

	$(".background").click(function(e) {
		e.preventDefault();
		$("#background").unbind().on("change", function(e) {
			$("#background_src").val($(this).val());
		});
		$("#background").click();
	});

	$(".exam1").click(function(e) {
		e.preventDefault();
		$("#exam1").unbind().on("change", function(e) {
			$("#exam1_src").val($(this).val());
		});
		$("#exam1").click();
	});

	$(".exam2").click(function(e) {
		e.preventDefault();
		$("#exam2").unbind().on("change", function(e) {
			$("#exam2_src").val($(this).val());
		});
		$("#exam2").click();
	});

	$(".exam3").click(function(e) {
		e.preventDefault();
		$("#exam3").unbind().on("change", function(e) {
			$("#exam3_src").val($(this).val());
		});
		$("#exam3").click();
	});

	$(".exam4").click(function(e) {
		e.preventDefault();
		$("#exam4").unbind().on("change", function(e) {
			$("#exam4_src").val($(this).val());
		});
		$("#exam4").click();
	});

	$(".exam5").click(function(e) {
		e.preventDefault();
		$("#exam5").unbind().on("change", function(e) {
			$("#exam5_src").val($(this).val());
		});
		$("#exam5").click();
	});

	$(".submit").click(function(e) {
		e.preventDefault();
		$("form").submit();
	});
});

//콘텐츠 이미지 설정 버튼 스크립트
function fileList(type, page){
	var pages = '';
	$.ajax({
		url : '/adm/contents/files/'+ page,
		method : 'GET',
		success : function(data){
			
			var totalPage = data.pagination[0];
			var startPage = data.pagination[1];
			var lastPage = data.pagination[2];
			var next = data.pagination[3];
			var currentPage = data.pagination[4];
			
//			console.log(totalPage, startPage, lastPage, next, currentPage);
			var img = '<div class="row"> ';
			$.each(data.files, function(idx, val){
				if (idx % 3 == 0) {
					img += '</div>';
					img += '<div class="row"> ';
				}
				img += '<div class="col m4 center-align img-select"> ' +
							'<img class="responsive-img" src="/uploads/'+val+'"/> ' +
							'<div class="fileName"> '+val+'</div>' + 
					   '</div>';
				if (idx == 8){
					img += '</div>';
				}	
			});
			
			$('.images').html(img);
			var paging = '<li ' +disabled(currentPage)+'><a class="pageGo" href="javascript:pageGo('+ (currentPage - 1)+')"><i class="material-icons">chevron_left</i></a></li> ';
			for (var i = startPage; i < lastPage + 1; i++){
				paging += '<li '+ active(currentPage, i) +'><a class="pageGo" href="javascript:pageGo('+i+')">'+i+'</a></li>';
			}
			if(next){
				paging += '<li class="waves-effect"><a class="pageGo" href="javascript:pageGo('+ (currentPage+1) +')"><i class="material-icons">chevron_right</i></a></li>';					
			}
			$('.pagination').html(paging);
			
			$('.img-select').click(function(){
				var hasClass = $(this).hasClass('img-selected');
				if(hasClass){
					$(this).removeClass('img-selected');
				}else{
					$(this).addClass('img-selected');
				}
				var img = $(this).find('img').attr('src');
			});
		}
	});
}

//토론 이미지 설정 버튼
function fileList1(type, page){
	var pages = '';
	$.ajax({
		url : '/adm/discuss/files/'+ page,
		method : 'GET',
		success : function(data){
			
			var totalPage = data.pagination[0];
			var startPage = data.pagination[1];
			var lastPage = data.pagination[2];
			var next = data.pagination[3];
			var currentPage = data.pagination[4];
			
//			console.log(totalPage, startPage, lastPage, next, currentPage);
			var img = '<div class="row"> ';
			$.each(data.files, function(idx, val){
				if (idx % 3 == 0) {
					img += '</div>';
					img += '<div class="row"> ';
				}
				img += '<div class="col m4 center-align img-select"> ' +
							'<img class="responsive-img" src="/discuss_imgs/'+val+'"/> ' +
							'<div class="fileName"> '+val+'</div>' + 
					   '</div>';
				if (idx == 8){
					img += '</div>';
				}	
			});
			
			$('.images').html(img);
			var paging = '<li ' +disabled(currentPage)+'><a class="pageGo" href="javascript:pageGo1('+ (currentPage - 1)+')"><i class="material-icons">chevron_left</i></a></li> ';
			for (var i = startPage; i < lastPage + 1; i++){
				paging += '<li '+ active(currentPage, i) +'><a class="pageGo" href="javascript:pageGo1('+i+')">'+i+'</a></li>';
			}
			if(next){
				paging += '<li class="waves-effect"><a class="pageGo" href="javascript:pageGo1('+ (currentPage+1) +')"><i class="material-icons">chevron_right</i></a></li>';					
			}
			$('.pagination').html(paging);
			
			$('.img-select').click(function(){
				var hasClass = $(this).hasClass('img-selected');
				if(hasClass){
					$(this).removeClass('img-selected');
				}else{
					$(this).addClass('img-selected');
				}
				var img = $(this).find('img').attr('src');
			});
		}
	});
}

//콘텐츠 이미지 설정 버튼 
function pageGo(page) {
	fileList(1,page);
}

//토론 이미지 설정 버튼 페이지
function pageGo1(page) {
	fileList1(1,page);
}

function disabled (currentPage){
	if(currentPage == 1){
		return 'class="disabled"';
	}else {
		return 'class="waves-effect"';
	}
}

function active(currentPage, i){
	if(currentPage == i){
		return ' class="active"';
	}else{
		return ' class="waves-effect"';
	}
}

function addQuestion(no){
	var contents = "";
	contents += '<div class=""> ' + 
		            '<div class="input-field col l12"> ' +
						'<input id="q'+no+'" name="q'+no+'" type="text" class="validate"> ' +
						'<label for="문항">'+no+'. 문항</label> ' +
						'<div class="add-choices"></div> ' + 
						'<div><a class="btn-floating waves-effect waves-light add-answer"><i class="material-icons">add</i></a>선택지 추가</div> ' +
						'<input type="hidden" class="count" name="count_q'+no+'" value="0">' +  
						'<div class="add-answer-zone"></div>' +  
					'</div> ' +
				'</div> ';
	$('.add-zone').append(contents);
	$('.add-zone').find("input[name='count_q"+no+"']").val(0);
	$(".add-answer").unbind().click(function(e) {
		$(this).parent().parent().find(".count").val(parseInt($(this).parent().parent().find(".count").val())+1);
		var answer = "";
		answer+= '<div class="row"> ' + 
		            '<div class="input-field col l12"> ' +
						'<div class="file-field input-field">' +
					    	'<div class="btn">' +
								'<span>이미지 등록</span>' +
						    	'<input type="file" name="a'+$($(this).parent().parent().find(".validate")[0]).attr("name").split("q")[1]+'_'+$(this).parent().parent().find(".count").val()+'">' +
					    	'</div>' +
					      	'<div class="file-path-wrapper">' +
					        	'<input class="file-path validate" type="text">' +
					      	'</div>' +
					    '</div>' +
					'</div> ' +
				'</div> ';
		$(this).parent().parent().find(".add-answer-zone").append(answer);
	});
};

$(document).ready(function(){
	
	$('.btn-contents').click(function(){
		var src = $('.img-selected').find('img');
		var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
		$.each(src, function(idx, val){
			F_body.append(val);
		});
		$('#modal1').closeModal();
	});
	
	
	$('#insert').click(function(e){
		var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
		var contents = F_body.html();
		var cate = $('[name=category]').val();
		var title = $('#title').val();
		var photo = $('[name=photo]').val();
		var userinfo = $('#user').val();
		
		var arr = userinfo.split("/");
		var userNo = arr[0];
		var writer = arr[1];
		//var writer = $('[name=writer]').val();
		
		if(cate == null) {
			alert('카테고리를 지정해주세요');
			return;
		}
		if(title == "") {
			alert('제목을 작성해주세요');
			return;
		}
		if(photo == ""){
			alert('썸네일 설정해주세요');
			return;
		}
		if(userinfo == ""){
			alert('에디터를 선택해주세요');
			return;
		}
		
		
		//console.log('contents : ' + contents + '| cate : ' + cate + ' | title + ' + title );
		$('[name=title]').val(title);
		$('[name=contents]').val(contents);
		$('[name=userNo]').val(userNo);
		$('[name=writer]').val(writer);
		//console.log(writer);
		//console.log(title);
		
		$('#cform').attr('action', '/adm/contents/insert');
		$('#cform').attr('method', 'post');
		$('#cform').submit();
		
//		var formData = new FormData();
//		formData.append('contents', contents); 
//		formData.append('cate', cate); 
//		formData.append('title', title); 
//		var xhr = new XMLHttpRequest();
//		
//		xhr.open("POST", '/adm/contents/insert');
//		xhr.send(formData);
	});
	
	$('#update').click(function(e){
		var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
		var contents = F_body.html();
		var cate = $('[name=category]').val();
		var title = $('#title').val();
		var photo = $('[name=photo]').val();
		var userinfo = $('#user').val();
		
		var rdate =  $('#rdate').val();
		
		var arr = userinfo.split("/");
		var userNo = arr[0];
		var writer = arr[1];
		//var num_check=/^[0-9]*$/; //0~9만 인정하겠다는 정규식
		
		if(cate == null) {
			alert('카테고리를 지정해주세요');
			return;
		}
		if(title == "") {
			alert('제목을 작성해주세요');
			return;
		}
		if(photo == ""){
			alert('썸네일 설정해주세요');
			return;
		}
		if(userinfo == ""){
			alert('에디터를 선택해주세요');
			return;
		}
		if(rdate == ""){
			alert('날짜를 입력해주세요');
			return;
		}
		
		//console.log('contents : ' + contents + '| cate : ' + cate + ' | title + ' + title );
		$('[name=title]').val(title);
		$('[name=contents]').val(contents);
		$('[name=userNo]').val(userNo);
		$('[name=writer]').val(writer);
		
		$('#cform').attr('action', '/adm/contents/update');
		$('#cform').attr('method', 'post');
		$('#cform').submit();
		
	});
	
	$(document).ready(function(){
		
		$('.btn-contents').click(function(){
			var src = $('.img-selected').find('img');
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			$.each(src, function(idx, val){
				F_body.append(val);
			});
			$('#modal1').closeModal();
		});
		
		$('#cons_insert').click(function(e){
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			var contents = F_body.html();
			var name = $('#name').val();
			var url = $('#url').val();
			var photo = $('[name=photo]').val();
			
			if(url == null) {
				alert('사이트URL를 지정해주세요');
				return;
			}
			if(name == "") {
				alert('회사명을 작성해주세요');
				return;
			}
			if(photo == ""){
				alert('썸네일 설정해주세요');
				return;
			}
			
			$('[name=name]').val(name);
			$('[name=contents]').val(contents);
			$('[name=url]').val(url);
			
			$('#csform').attr('action', '/adm/consulting/insert');
			$('#csform').attr('method', 'post');
			$('#csform').submit();
			
		});
		
		$('#cons_update').click(function(e){
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			var contents = F_body.html();
			var name = $('#name').val();
			var url = $('#url').val();
			var photo = $('[name=photo]').val();
			
			if(url == null) {
				alert('사이트URL를 지정해주세요');
				return;
			}
			if(name == "") {
				alert('회사명을 작성해주세요');
				return;
			}
			if(photo == ""){
				alert('썸네일 설정해주세요');
				return;
			}
			
			$('[name=name]').val(name);
			$('[name=contents]').val(contents);
			$('[name=url]').val(url);
			
			$('#csform').attr('action', '/adm/consulting/update');
			$('#csform').attr('method', 'post');
			$('#csform').submit();
			
		});
	});

	$(document).ready(function(){
		
		$('.btn-contents').click(function(){
			var src = $('.img-selected').find('img');
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			$.each(src, function(idx, val){
				F_body.append(val);
			});
			
			$('#modal1').closeModal();
		});
		
		$('#discuss_insert').click(function(e){
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			var contents = F_body.html();
			var title = $('#title').val();
			var cate = $('[name=category]').val();
			var photo = $('[name=photo]').val();
			var writer = $('#writer').val();
			var comt_1 = $('#icon_prefix').val();
			var comt_2 = $('#icon_telephone').val();

			if(title == "") {
				alert('제목을 작성해주세요');
				return;
			}
			if(cate == "") {
				alert('카테고리를 선택해주세요.');
				return;
			}
			if(photo == ""){
				alert('썸네일 설정해주세요');
				return;
			}
			if(writer == ""){
				alert('등록자 설정해주세요');
				return;
			}
			if(comt_1 == ""){
				alert('문항을 설정해주세요');
				return;
			}
			if(comt_2 == ""){
				alert('문항을 설정해주세요');
				return;
			}
			
			$('[name=name]').val(name);
			
			$('#discussform').attr('action', '/adm/discuss/insert');
			$('#discussform').attr('method', 'post');
			$('#discussform').submit();
			
		});
		
		$('#discuss_update').click(function(e){
			var F_body = $('iframe').contents().find('#se2_iframe').contents().find('.se2_inputarea');
			var contents = F_body.html();
			var title = $('#title').val();
			var cate = $('[name=category]').val();
			var photo = $('[name=photo]').val();
			var writer = $('#writer').val();
			var comt_1 = $('#icon_prefix').val();
			var comt_2 = $('#icon_telephone').val();

			var rdate =  $('#rdate').val();
		

			if(title == "") {
				alert('제목을 작성해주세요');
				return;
			}
			if(cate == "") {
				alert('카테고리를 선택해주세요.');
				return;
			}
			if(photo == ""){
				alert('썸네일 설정해주세요');
				return;
			}
			if(writer == ""){
				alert('등록자 설정해주세요');
				return;
			}
			if(comt_1 == ""){
				alert('문항을 설정해주세요');
				return;
			}
			if(comt_2 == ""){
				alert('문항을 설정해주세요');
				return;
			}
			
			$('[name=name]').val(name);
			
			$('#discussform').attr('action', '/adm/discuss/update');
			$('#discussform').attr('method', 'post');
			$('#discussform').submit();
			
		});
	});
	
	
});