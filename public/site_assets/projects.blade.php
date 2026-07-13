@extends("app")
@section('head_title', 'All Properties | '.getcong('site_name') )
@section('head_url', Request::url())
@section("content")
<style>
ul.list li.item{list-style: none; border-bottom:1px solid #6a6969; width: 100%; float: left; padding: 20px 0;}
.project h2{text-transform: uppercase;font-size: 20px;line-height: 20px;}
.white{color:#fff;}
.item-data a{color:#999 !important; text-decoration: underline !important;}
.item-data a:hover{color:#fff !important;}
.bg-white{background:#fff;color:#000 !important;font-weight: normal;}
.btn{border-radius: 4px;margin-top: 30px;}
.btn a{text-decoration: normal !important;}
.btn:hover{border:1px solid #fff; background:#000; color:#fff !important;}
.proj-img{max-height: 263px; min-width: 100%;}
.item-data p{margin-bottom: 5px;}
.item-data .data{padding-top:20px;}
</style>
<div class="project">
	<!--Breadcrumb Section-->
	<section class="breadcrumb-box">
	<div class="inner-container container text-center">
	  <div class="breadcrumb">
		<ul class="list-inline">
		  <li class="home"><a href="{{ URL::to('/') }}">Home</a></li>
		  <li> > </li>
		  <li>Luxury Projects & Investment Opportunities</li>
		</ul>
	  </div>
	   <h1>Luxury Projects & Investment Opportunities</h1>
	</div>
	</section>
	<!--Breadcrumb Section-->
	<div class="container">
		<p class="text-center">New luxury developments and curated quality investment options in the off-plan market</p>
		<ul class="list">
		<?php for($i=0; $i <=5; $i++ ){ ?>
			<li class="item">
				<div class="col-sm-4 ps-0">
					<img class="img-responsive proj-img" src="http://digitalfy.in/dlh/public/upload/website/home-banners-b6c6a61a4c514c6f0490a6a3fdc39a67.jpg" />
				</div>
				<div class="col-sm-8 item-data">
					<h2 class="white">Beach Isle</h2>
					<span>by <a href="#">EMAAR</a></span>
					<div class="col-sm-12 ps-0 data">
						<div class="col-sm-6 ps-0">
							<p><span class="white">City:</span><span> Dubai</span></p>
							<p><span class="white">Location:</span><span> Dubai Harbour</span></p>
							<p><span class="white">Price: </span><span>From AED 1,500,000</span></p>
							<p><span class="white">Bedrooms: </span><span>From 1 to 4</span></p>
						</div>
						<div class="col-sm-6 ps-0">
							<p><span class="white">Completion: </span><span>Early 2023</span></p>
							<p><span class="white">Payment plan:</span><span> Available</span></p>
						</div>
						<div class="col-sm-12 ps-0">
						<a href="#" class="btn bg-white">View Details</a>
						</div>
					</div>
				</div>
			</li>
		<?php } ?>
		</ul>
	</div>
</div>
@endsection